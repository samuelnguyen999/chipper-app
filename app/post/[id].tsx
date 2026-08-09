import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useFontPresetSubscription } from "../../components/profile";
import { layout, textStyles } from "../../constants";

export default function PostScreen() {
  useFontPresetSubscription();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={textStyles.caption}>Post id</Text>
      <Text style={textStyles.emphasis}>{id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: layout.screenPadding,
    justifyContent: "center",
  },
});
