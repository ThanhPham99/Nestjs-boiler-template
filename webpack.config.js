/* eslint-disable @typescript-eslint/no-var-requires */
const nodeExternals = require('webpack-node-externals');
const path = require('path');
const { EsbuildPlugin } = require('esbuild-loader');

const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  // mode: 'production',
  entry: { main: './src/main.ts' },
  devtool: 'inline-source-map',
  output: {
    path: path.resolve(__dirname, './build'),
    filename: 'main.js', // <-- Important
    libraryTarget: 'commonjs2', // <-- Important
  },
  target: 'node', // <-- Important
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
      },
    ],
  },
  cache: {
    type: 'filesystem', // Stores cache in node_modules/.cache/webpack
    buildDependencies: {
      config: [__filename], // Invalidate cache if config changes
    },
  },
  optimization: {
    minimize: true,
    minimizer: [
      new EsbuildPlugin({
        target: 'ES2023',
        css: true,
        keepNames: true
      })
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    plugins: [new TsconfigPathsPlugin()],
  },
  externals: [nodeExternals()], // <-- Important
};
