const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// Monorepo: root node_modules klasörünü de izle
config.watchFolders = [workspaceRoot];

// nodeModulesPaths: proje dosyaları için ek arama yolları
// NOT: disableHierarchicalLookup KALDIRILDI — bu ayar açıkken Metro,
// node_modules içindeki paketlerin birbirini bulmasını engelliyor.
// npm workspace hoisting ile expo-router, @expo/metro-runtime vb.
// root/node_modules'a taşındığında hiyerarşik arama şarttır.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = withNativeWind(config, { input: "./global.css" });
