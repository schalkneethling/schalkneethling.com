const StyleDictionary = require("style-dictionary");

StyleDictionary.registerTransform({
  name: "value/topx",
  type: "value",
  matcher: function (token) {
    return token.attributes.category === "layout";
  },
  transformer: function (token) {
    return `${token.value}px`;
  },
});

StyleDictionary.registerTransform({
  name: "value/torem",
  type: "value",
  matcher: function (token) {
    return token.attributes.category === "typography";
  },
  transformer: function (token) {
    return `${token.value}rem`;
  },
});

module.exports = {
  source: ["tokens/**/*.json"],
  platforms: {
    scss: {
      transformGroup: "scss",
      transforms: ["value/torem", "value/topx"],
      buildPath: "sass/",
      files: [
        {
          destination: "tokens/_styleguide.scss",
          format: "scss/variables",
        },
      ],
    },
  },
};
