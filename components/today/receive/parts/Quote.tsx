import { Text, StyleSheet, View } from "react-native";
import { spacing, textStyles } from "../../../../constants";

type ReceiveLandingQuoteProps = {
  text: string;
};

export default function ReceiveLandingQuote({ text }: ReceiveLandingQuoteProps) {
  return (
    <View style={styles.wrap}>
      <Text style={textStyles.bodyCenter}>{text}</Text>
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
