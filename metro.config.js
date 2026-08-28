const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.blockList.push(
  /node_modules\/expo-dev-launcher\/android\/build-corrupt\/.*/,
);

module.exports = config;