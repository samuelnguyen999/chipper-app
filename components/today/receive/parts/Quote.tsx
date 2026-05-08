import { Text, StyleSheet, View } from "react-native";
import { textStyles } from "../../../../constants";

type ReceiveLandingQuoteProps = {
  text: string;
};

export default function ReceiveLandingQuote({ text }: ReceiveLandingQuoteProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.quote}>“{text}”</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
  },
  quote: {
    ...textStyles.bodyCenter,
  },
});
