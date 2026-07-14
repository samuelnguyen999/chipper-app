import { StyleSheet, Text, View } from "react-native";
import {
  colors,
  font,
  scaleLineHeight,
  spacing,
  textSize,
  textStyles,
} from "../../constants";
import CardContainer from "./CardContainer";
import CardShell from "./CardShell";
import type { ReflectionCardData } from "./types";

type ReflectionCardProps = {
  card: ReflectionCardData;
  onHold?: () => void;
};

export default function ReflectionCard({ card, onHold }: ReflectionCardProps) {
  return (
    <CardContainer onHold={onHold}>
      <CardShell>
        <View style={styles.leadRow}>
          <Text style={[font("semibold"), styles.mode, textSize("body")]}>{card.mode}</Text>
          <Text style={[font("regular"), styles.leadMuted, textSize("body"), { lineHeight: scaleLineHeight("body") }]}> → </Text>
          <Text style={[font("semibold"), styles.prompt, textSize("body"), { lineHeight: scaleLineHeight("body") }]}>“{card.prompt}”</Text>
        </View>
        <Text style={[textStyles.caption, styles.responseLabel]}>Response</Text>
        <Text style={textStyles.body}>{card.response}</Text>
      </CardShell>
    </CardContainer>
  );
}

const styles = StyleSheet.create({
  leadRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  mode: {
    color: colors.accent,
  },
  leadMuted: {
    color: colors.textMuted,
  },
  prompt: {
    color: colors.text,
  },
  responseLabel: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
});
