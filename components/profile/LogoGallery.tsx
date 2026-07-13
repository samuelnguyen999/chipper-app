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
import { colors, layout, radii, spacing, textStyles } from "../../constants";
import { profileGalleryLayout } from "./config";
import { profileLogos, type ProfileLogo } from "./logoAssets";

/** Fisher-Yates shuffle — returns a new array, does not mutate the input. */
function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function LogoGallery() {
  const { width: windowWidth } = useWindowDimensions();
  const [selected, setSelected] = useState<ProfileLogo | null>(null);
  // Randomize logo + merch order once per mount (stable while browsing).
  const [galleryItems] = useState(() => shuffle(profileLogos));

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
        data={galleryItems}
        keyExtractor={(item) => item.id}
        numColumns={profileGalleryLayout.columns}
        renderItem={renderItem}
        style={styles.list}
        contentContainerStyle={styles.content}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
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
                <Text style={[textStyles.caption, styles.viewerLabel]}>{selected.label}</Text>
                <Image source={selected.source} style={styles.viewerImage} resizeMode="contain" />
                <Text style={[textStyles.caption, styles.viewerHint]}>Tap anywhere to close</Text>
              </>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    width: "100%",
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: layout.screenScrollBottomPadding,
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
    color: colors.onPrimaryMuted,
    textAlign: "center",
  },
  viewerImage: {
    width: "100%",
    height: "72%",
    minHeight: 240,
  },
  viewerHint: {
    color: colors.onPrimaryMuted,
    opacity: 0.85,
  },
});
