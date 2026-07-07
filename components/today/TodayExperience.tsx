import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { screen } from "../../constants";
import { resolveDevGateFlags } from "../../state/onboardingGate";
import ReceiveLanding from "./receive";
import Reflect from "./reflect";

type TodayExperienceProps = {
  onUnlocked?: () => void;
};

export default function TodayExperience({ onUnlocked }: TodayExperienceProps) {
  const devStartAt = resolveDevGateFlags().startAt;
  const [showReflect, setShowReflect] = useState(devStartAt === "reflect");

  return (
    <View style={styles.container}>
      {showReflect ? (
        <Reflect onUnlocked={onUnlocked} />
      ) : (
        <ReceiveLanding onContinueToReflect={() => setShowReflect(true)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: screen.tabSceneRoot,
});
