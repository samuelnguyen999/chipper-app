import ReflectionCard from "../cards/ReflectionCard";
import type { ReflectionCardData } from "../cards/types";
import type { ReflectionRow } from "../../lib/reflections";

type CommunityReflectionCardProps = {
  reflection: ReflectionRow;
  onHold?: () => void;
};

function toCardData(reflection: ReflectionRow): ReflectionCardData {
  return {
    id: reflection.id,
    mode: reflection.card_type.toUpperCase(),
    prompt: reflection.question,
    response: reflection.response,
  };
}

/** Community adapter: ReflectionRow → ReflectionCardData → ReflectionCard. */
export default function CommunityReflectionCard({
  reflection,
  onHold,
}: CommunityReflectionCardProps) {
  return <ReflectionCard card={toCardData(reflection)} onHold={onHold} />;
}
