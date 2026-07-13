// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Metro matches asset extensions case-sensitively, and its defaults are all
// lowercase. Phone exports often use uppercase (e.g. `.JPG`), which would
// otherwise be treated as JS modules and fail to resolve. Register both cases.
config.resolver.assetExts = Array.from(
  new Set([
    ...config.resolver.assetExts,
    ...config.resolver.assetExts.map((ext) => ext.toUpperCase()),
  ]),
);

module.exports = config;
