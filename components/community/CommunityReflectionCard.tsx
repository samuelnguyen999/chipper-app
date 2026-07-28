import ReflectionCard from "../cards/ReflectionCard";
import type { ReflectionCardData } from "../cards/types";
import type { ReflectionRow } from "../../lib/reflections";
import { lensTypeFromCardType } from "../today/reflect/config";

type CommunityReflectionCardProps = {
  reflection: ReflectionRow;
  onHold?: () => void;
};

function toCardData(reflection: ReflectionRow): ReflectionCardData {
  const type = lensTypeFromCardType(reflection.card_type);
  return {
    id: reflection.id,
    type,
    mode: type.toUpperCase(),
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
