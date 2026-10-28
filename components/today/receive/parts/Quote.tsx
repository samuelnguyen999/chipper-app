import { Text, StyleSheet, View } from "react-native";
import { spacing, textStyles } from "../../../../constants";

type ReceiveLandingQuoteProps = {
  text: string;
  /** Native iOS/Android text selection (long-press Copy). Off by default for onboarding. */
  selectable?: boolean;
};

export default function ReceiveLandingQuote({
  text,
  selectable = false,
}: ReceiveLandingQuoteProps) {
  return (
    <View style={styles.wrap}>
      <Text style={textStyles.bodyCenter} selectable={selectable}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "stretch",
    width: "100%",
    alignItems: "center",
    /** Extra inset so copy clears the cookie-circle watermark ring. */
    paddingHorizontal: spacing.xxxl,
  },
});
