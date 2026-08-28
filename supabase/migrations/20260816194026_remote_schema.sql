-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

SET check_function_bodies = false;

DROP EXTENSION pg_net;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE UPDATE ON SEQUENCES FROM anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE UPDATE ON SEQUENCES FROM authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE UPDATE ON SEQUENCES FROM service_role;

CREATE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
  AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

CREATE FUNCTION public.test_auth_uid()
  RETURNS json
  LANGUAGE sql
  AS $function$
  select json_build_object(
    'uid', auth.uid(),
    'role', auth.role()
  );
$function$;

CREATE TABLE public.reactions (
  id            uuid                     DEFAULT gen_random_uuid() NOT NULL,
  user_id       uuid                     NOT NULL,
  reflection_id uuid                     NOT NULL,
  reaction_type text                     NOT NULL,
  reaction_date date                     NOT NULL,
  created_at    timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.reactions
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.reactions
  ADD CONSTRAINT one_reaction_per_post UNIQUE (user_id, reflection_id);

ALTER TABLE public.reactions
  ADD CONSTRAINT reactions_pkey PRIMARY KEY (id);

ALTER TABLE public.reactions
  ADD CONSTRAINT reactions_reaction_type_check CHECK (reaction_type = ANY (ARRAY['encouraged'::text, 'relate'::text, 'inspired'::text]));

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.reactions TO anon;

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.reactions TO authenticated;

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.reactions TO service_role;

CREATE TABLE public.reflections (
  id              uuid                     DEFAULT gen_random_uuid() NOT NULL,
  user_id         uuid                     NOT NULL,
  card_type       text                     NOT NULL,
  question        text                     NOT NULL,
  response        text                     NOT NULL,
  is_public       boolean                  DEFAULT false NOT NULL,
  reflection_date date                     NOT NULL,
  created_at      timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.reflections
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.reflections
  ADD CONSTRAINT one_reflection_per_day UNIQUE (user_id, reflection_date);

ALTER TABLE public.reflections
  ADD CONSTRAINT reflections_card_type_check CHECK (card_type = ANY (ARRAY['ground'::text, 'understand'::text, 'align'::text]));

ALTER TABLE public.reflections
  ADD CONSTRAINT reflections_pkey PRIMARY KEY (id);

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.reflections TO anon;

GRANT ALL ON public.reflections TO authenticated;

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.reflections TO service_role;

CREATE POLICY "delete own reflections" ON public.reflections
  FOR DELETE
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "insert own reflection" ON public.reflections
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "read own reflections" ON public.reflections
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "read public reflections" ON public.reflections
  FOR SELECT
  TO authenticated
  USING ((is_public = true));

CREATE POLICY "update own reflections" ON public.reflections
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE EVENT TRIGGER ensure_rls
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION public.rls_auto_enable();
