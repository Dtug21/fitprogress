module.exports = function (api) {
  const isWeb = api.caller((caller) => caller?.platform === 'web');
  api.cache.using(() => isWeb);

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      // Solo en web: evita SyntaxError con import.meta en Zustand devtools.
      isWeb && ['babel-plugin-transform-import-meta', { module: 'ES6' }],
    ].filter(Boolean),
  };
};
