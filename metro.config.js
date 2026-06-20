const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// En web, Metro resuelve Zustand a su build ESM (./esm/*.mjs) que usa
// `import.meta.env` en el middleware devtools. Cargado como <script> clásico
// eso lanza SyntaxError y deja la app en pantalla negra. Forzamos el build
// CommonJS de Zustand (que sí funciona en script clásico) en todas las plataformas.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
    const sub = moduleName === 'zustand' ? 'index' : moduleName.slice('zustand/'.length);
    return {
      type: 'sourceFile',
      filePath: path.join(__dirname, 'node_modules', 'zustand', `${sub}.js`),
    };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
