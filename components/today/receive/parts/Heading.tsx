import { Text, StyleSheet, View } from "react-native";
import { textStyles } from "../../../../constants";

type ReceiveLandingHeadingProps = {
  title: string;
};

export default function ReceiveLandingHeading({
  title,
}: ReceiveLandingHeadingProps) {
  return (
    <View style={styles.wrap} accessibilityRole="header">
      <Text style={[textStyles.screenTitle, styles.title]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
  },
  title: {
    textAlign: "center",
  },
});
