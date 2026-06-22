import { StyleSheet, Text, View } from "react-native";
import {
  colors,
  font,
  scaleLineHeight,
  spacing,
  textSize,
  textStyles,
} from "../../constants";
import CardShell from "../today/reflect/parts/CardShell";

type CommunityReflectionCardProps = {
  mode: string;
  prompt: string;
  response: string;
};

export default function CommunityReflectionCard({
  mode,
  prompt,
  response,
}: CommunityReflectionCardProps) {
  return (
    <CardShell>
      <View style={styles.leadRow}>
        <Text style={[font("semibold"), styles.mode, textSize("body")]}>{mode}</Text>
        <Text style={[font("regular"), styles.leadMuted, textSize("body"), { lineHeight: scaleLineHeight("body") }]}> → </Text>
        <Text style={[font("semibold"), styles.prompt, textSize("body"), { lineHeight: scaleLineHeight("body") }]}>“{prompt}”</Text>
      </View>
      <Text style={[textStyles.caption, styles.responseLabel]}>Response</Text>
      <Text style={textStyles.body}>{response}</Text>
    </CardShell>
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
