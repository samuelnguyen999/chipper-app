/** Grid layout tuning for the profile logo gallery. */
export const profileGalleryLayout = {
  columns: 2,
  tileAspectRatio: 1,
  tilePadding: 12,
  /** Shuffled subset shown per mount / session; pool stays full `profileLogos`. */
  sessionCount: 8,
} as const;
