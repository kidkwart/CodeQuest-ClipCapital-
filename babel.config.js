module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      "babel-plugin-transform-import-meta",
      "react-native-worklets-core/plugin",
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./src",
            "react-native-worklets": "react-native-worklets-core",
          },
        },
      ],
      "react-native-reanimated/plugin", // MUST BE LAST
    ],
  };
};
