import { StyleSheet, Text, View } from "react-native";
import { layout, screen, textStyles } from "../../constants";
import { receiveCopy, ReceiveQuote } from "./receive";

export default function TodayRecap() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today</Text>
      <ReceiveQuote text={receiveCopy.quote} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...screen.fill,
    paddingTop: layout.screenPadding,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: layout.screenScrollBottomPadding,
    justifyContent: "flex-start",
    gap: layout.screenColumnGap,
  },
  title: {
    ...textStyles.screenTitle,
  },
});
