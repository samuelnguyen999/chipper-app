import { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { colors, layout, radii, screen, spacing, textStyles } from "../../constants";
import { profileGalleryLayout } from "./config";
import { profileLogos, type ProfileLogo } from "./logoAssets";

export default function LogoGallery() {
  const { width: windowWidth } = useWindowDimensions();
  const [selected, setSelected] = useState<ProfileLogo | null>(null);

  const horizontalPad = layout.screenPadding * 2;
  const columnGap = layout.screenColumnGap;
  const tileWidth =
    (windowWidth - horizontalPad - columnGap * (profileGalleryLayout.columns - 1)) /
    profileGalleryLayout.columns;
  const tileHeight = tileWidth / profileGalleryLayout.tileAspectRatio;

  const closeViewer = useCallback(() => setSelected(null), []);

  const renderItem = useCallback(
    ({ item }: { item: ProfileLogo }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${item.label}`}
        onPress={() => setSelected(item)}
        style={({ pressed }) => [
          styles.tile,
          { width: tileWidth, height: tileHeight },
          pressed && styles.tilePressed,
        ]}
      >
        <Image source={item.source} style={styles.thumbnail} resizeMode="contain" />
      </Pressable>
    ),
    [tileWidth, tileHeight],
  );

  return (
    <>
      <FlatList
        data={profileLogos}
        keyExtractor={(item) => item.id}
        numColumns={profileGalleryLayout.columns}
        renderItem={renderItem}
        style={styles.list}
        contentContainerStyle={styles.content}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Your Profile</Text>
            <Text style={styles.subtitle}>Logo gallery</Text>
          </View>
        }
      />

      <Modal
        visible={selected != null}
        transparent
        animationType="fade"
        onRequestClose={closeViewer}
      >
        <Pressable style={styles.viewerBackdrop} onPress={closeViewer} accessibilityLabel="Close">
          <View style={styles.viewerCard} pointerEvents="box-none">
            {selected ? (
              <>
                <Text style={styles.viewerLabel}>{selected.label}</Text>
                <Image source={selected.source} style={styles.viewerImage} resizeMode="contain" />
                <Text style={styles.viewerHint}>Tap anywhere to close</Text>
              </>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  list: screen.scroll,
  content: screen.scrollContent,
  header: {
    marginBottom: layout.screenHeaderAfterMargin,
  },
  title: {
    ...textStyles.screenTitle,
  },
  subtitle: {
    ...textStyles.body,
    marginTop: spacing.xs,
    color: colors.textMuted,
  },
  row: {
    gap: layout.screenColumnGap,
    marginBottom: layout.screenColumnGap,
  },
  tile: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: profileGalleryLayout.tilePadding,
    alignItems: "center",
    justifyContent: "center",
  },
  tilePressed: {
    opacity: 0.88,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: layout.screenPadding,
  },
  viewerCard: {
    width: "100%",
    maxHeight: "88%",
    alignItems: "center",
    gap: spacing.md,
  },
  viewerLabel: {
    ...textStyles.caption,
    color: colors.onPrimaryMuted,
    textAlign: "center",
  },
  viewerImage: {
    width: "100%",
    height: "72%",
    minHeight: 240,
  },
  viewerHint: {
    ...textStyles.caption,
    color: colors.onPrimaryMuted,
    opacity: 0.85,
  },
});
