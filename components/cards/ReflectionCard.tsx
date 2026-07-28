import { StyleSheet, Text } from "react-native";
import { colors, font, scaleLineHeight, spacing, textSize, textStyles } from "../../constants";
import { lensColorForType } from "../today/reflect/config";
import CardContainer from "./CardContainer";
import CardShell from "./CardShell";
import type { ReflectionCardData } from "./types";

type ReflectionCardProps = {
  card: ReflectionCardData;
  onHold?: () => void;
};

export default function ReflectionCard({ card, onHold }: ReflectionCardProps) {
  const borderColor = lensColorForType(card.type);

  return (
    <CardContainer onHold={onHold}>
      <CardShell style={{ borderColor }}>
        <Text
          style={[
            font("semibold"),
            styles.prompt,
            textSize("body"),
            { lineHeight: scaleLineHeight("body") },
          ]}
        >
          “{card.prompt}”
        </Text>
        <Text style={textStyles.body}>{card.response}</Text>
      </CardShell>
    </CardContainer>
  );
}

const styles = StyleSheet.create({
  prompt: {
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.md,
  },
});
