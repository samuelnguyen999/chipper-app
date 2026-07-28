import { useCallback, useState } from "react";
import {
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

type LogoGalleryProps = {
  /** When true, omit outer horizontal/bottom padding (parent ScrollView owns insets). */
  embedded?: boolean;
};

/** Non-scrolling logo grid for a parent ScrollView (no nested scroll). */
export default function LogoGallery({ embedded = false }: LogoGalleryProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [selected, setSelected] = useState<ProfileLogo | null>(null);
  const [galleryItems] = useState(() => shuffle(profileLogos));

  const columnGap = layout.screenColumnGap;
  const tileWidth =
    (windowWidth - layout.screenPadding * 2 - columnGap * (profileGalleryLayout.columns - 1)) /
    profileGalleryLayout.columns;
  const tileHeight = tileWidth / profileGalleryLayout.tileAspectRatio;

  const closeViewer = useCallback(() => setSelected(null), []);

  return (
    <>
      <View style={[styles.section, embedded ? styles.sectionEmbedded : styles.sectionStandalone]}>
        {embedded ? (
          <Text style={textStyles.screenSubtitle}>Gallery</Text>
        ) : null}
        <View style={styles.grid}>
          {galleryItems.map((item) => (
            <Pressable
              key={item.id}
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
          ))}
        </View>
      </View>

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
  section: {
    width: "100%",
    gap: spacing.md,
  },
  sectionEmbedded: {
    paddingBottom: 0,
  },
  sectionStandalone: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: layout.screenScrollBottomPadding,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: layout.screenColumnGap,
    width: "100%",
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
