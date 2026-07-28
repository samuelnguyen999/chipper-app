import { StyleSheet, Text, View } from "react-native";
import { colors, layout, screen, textStyles } from "../../constants";
import Watermark from "../ui/Watermark";
import { receiveCopy, ReceiveQuote } from "./receive";

/**
 * Reserves the ponder-hint band below the quote (same gap + line height as Receive)
 * without showing hint copy — keeps vertical rhythm aligned with the experience flow.
 */
function RecapHintSlot() {
  return (
    <View
      style={styles.hintSlot}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={[textStyles.caption, styles.hintPlaceholder]}>{receiveCopy.ponderHint}</Text>
    </View>
  );
}

export default function TodayRecap() {
  return (
    <View style={styles.container}>
      <Watermark surface="today" />
      <View style={styles.content}>
        <Text style={textStyles.screenTitle}>Today</Text>
        <View style={styles.quoteStage}>
          <View style={styles.centerCluster}>
            <ReceiveQuote text={receiveCopy.quote} />
            <RecapHintSlot />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...screen.fill,
    paddingTop: layout.screenPadding,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: layout.screenScrollBottomPadding,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  quoteStage: {
    flex: 1,
    justifyContent: "center",
    alignSelf: "stretch",
    minHeight: 0,
  },
  centerCluster: {
    gap: layout.sectionGap,
    alignSelf: "stretch",
  },
  hintSlot: {
    alignSelf: "stretch",
  },
  hintPlaceholder: {
    opacity: 0,
    marginBottom: 0,
    textAlign: "center",
    alignSelf: "stretch",
    color: colors.textMuted,
  },
});
