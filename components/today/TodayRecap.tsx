import { StyleSheet, Text, View } from "react-native";
import { colors, layout, screen, textStyles } from "../../constants";
import Watermark from "../ui/Watermark";
import { receiveCopy, ReceiveLandingQuote } from "./receive";

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

/**
 * Today tab recap — watermark fills the scene above the tab bar
 * (same stage box as Receive landing above the CTA dock).
 */
export default function TodayRecap() {
  return (
    <View style={styles.container}>
      <View style={styles.watermarkStage}>
        <Watermark surface="today" />
        <View style={styles.content}>
          <Text style={textStyles.screenTitle}>Today</Text>
          <View style={styles.quoteStage}>
            <View style={styles.centerCluster}>
              <ReceiveLandingQuote text={receiveCopy.quote} selectable />
              <RecapHintSlot />
            </View>
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
  },
  /** Full scene above tab bar — matches Receive `watermarkStage` above CTA dock. */
  watermarkStage: {
    flex: 1,
    minHeight: 0,
    position: "relative",
    overflow: "hidden",
  },
  content: {
    flex: 1,
    zIndex: 1,
    paddingHorizontal: layout.screenPadding,
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
