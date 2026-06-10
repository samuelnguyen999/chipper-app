/**
 * Logo gallery assets — populated from everything in `assets/Logos`.
 *
 * React Native / Metro cannot read a folder on the device at runtime; a small
 * Node script scans the folder at dev time and emits static `require()` calls.
 *
 * After adding or removing files: `npm run sync:logos`
 */
export { profileLogos, type ProfileLogo } from "./logoAssets.generated";
