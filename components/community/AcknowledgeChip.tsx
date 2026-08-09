import { Image } from "react-native";

type AcknowledgeChipProps = {
  size?: number;
};

const COOKIE = require("../../assets/Logos/clipart cookie.png");

/** Default mark size on community cards — hang offsets key off this. */
export const ACKNOWLEDGE_CHIP_SIZE = 68;

/** Quiet acknowledgement mark — cookie glyph (reader-only). */
export default function AcknowledgeChip({
  size = ACKNOWLEDGE_CHIP_SIZE,
}: AcknowledgeChipProps) {
  return (
    <Image
      source={COOKIE}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessibilityLabel="Quietly acknowledged"
    />
  );
}
