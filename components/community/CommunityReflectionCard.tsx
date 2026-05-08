import { StyleSheet, Text, View } from "react-native";
import {
  colors,
  fontSize,
  fontWeight,
  lineHeight,
  spacing,
  textStyles,
} from "../../constants";
import ReflectionCardShell from "../today/reflect/ReflectionCardShell";

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
    <ReflectionCardShell>
      <View style={styles.leadRow}>
        <Text style={styles.mode}>{mode}</Text>
        <Text style={styles.leadMuted}> → </Text>
        <Text style={styles.prompt}>“{prompt}”</Text>
      </View>
      <Text style={styles.responseLabel}>Response</Text>
      <Text style={styles.response}>{response}</Text>
    </ReflectionCardShell>
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
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    color: colors.accent,
  },
  leadMuted: {
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    color: colors.textMuted,
  },
  prompt: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    lineHeight: lineHeight.body,
  },
  responseLabel: {
    ...textStyles.caption,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  response: {
    ...textStyles.body,
  },
});
