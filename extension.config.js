function externalPlugin(options = {}) {
  return {
    name: "external-plugin",
    options(inputOptions) {
      const externals = inputOptions.external;
      const customExternals = options.externals;

      inputOptions.external = Array.isArray(customExternals) ? [...externals, ...customExternals] : externals;
    }
  };
}
export default {
  plugins: [
    externalPlugin({
      externals: []
    })
  ]
};
