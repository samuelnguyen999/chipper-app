CREATE TABLE public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id uuid NOT NULL DEFAULT auth.uid(),
  reflection_id uuid NOT NULL REFERENCES public.reflections (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT one_report_per_user_per_reflection UNIQUE (reporter_user_id, reflection_id)
);

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.content_reports FROM PUBLIC;
REVOKE ALL ON TABLE public.content_reports FROM anon;
REVOKE ALL ON TABLE public.content_reports FROM authenticated;

GRANT INSERT ON TABLE public.content_reports TO authenticated;

CREATE POLICY "insert report for another user's public reflection"
ON public.content_reports
FOR INSERT
TO authenticated
WITH CHECK (
  reporter_user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.reflections AS target
    WHERE target.id = reflection_id
      AND target.is_public = true
      AND target.user_id <> auth.uid()
  )
);
