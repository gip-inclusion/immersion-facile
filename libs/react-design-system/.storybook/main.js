import { dirname, join } from "path";
module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-interactions"),
    {
      name: "@storybook/addon-styling",
      options: {
        sass: {
          implementation: require("sass"),
        },
      },
    },
    getAbsolutePath("@storybook/addon-mdx-gfm"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },
  docs: {
    autodocs: true,
  },
  staticDirs: ["../public"],
};

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, "package.json")));
}
