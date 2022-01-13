const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const GlobEntries = require("webpack-glob-entries");

module.exports = {
  mode: "production",
  entry: GlobEntries("./src/*.test.ts"),
  output: {
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "commonjs",
    filename: "[name].js",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "babel-loader",
        exclude: /node_modules/,
      },
    ],
  },
  target: "web",
  externals: /^(k6|https?\:\/\/)(\/.*)?/,
  devtool: "source-map",
  stats: {
    colors: true,
  },
  plugins: [new CleanWebpackPlugin()],
  optimization: {
    minimize: false,
  },
};
