import { StyleSheet, Text } from "react-native";
import { colors, textStyles } from "../../../../constants";

type ReceiveLandingPonderHintProps = {
  text: string;
};

/** Caption above the centered quote during ponder / ready (progress lives on the CTA slot). */
export default function ReceiveLandingPonderHint({
  text,
}: ReceiveLandingPonderHintProps) {
  return <Text style={styles.hint}>{text}</Text>;
}

const styles = StyleSheet.create({
  hint: {
    ...textStyles.caption,
    marginBottom: 0,
    textAlign: "center",
    alignSelf: "stretch",
    color: colors.textMuted,
  },
});
