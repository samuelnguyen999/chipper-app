import { View, Text, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { colors, textStyles } from "../constants";

export default function NotFoundScreen() {
  return (
      <View style={styles.container}>
        <Text style={[textStyles.emphasis, styles.text]}>Page Not Found</Text>
        <Link href="/" style={[textStyles.link, styles.link]}>
          Go to Home
        </Link>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.notFoundBackground,
  },
  text: {
    color: colors.notFoundText,
  },
  link: {
    color: colors.notFoundLink,
  },
});
