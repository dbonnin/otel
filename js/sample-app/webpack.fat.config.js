const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './app.ts',
  target: 'node',
  mode: 'production',
  module: { rules: [{ test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ }] },
  resolve: { extensions: ['.ts', '.js'] },
  output: {
    filename: 'app-fat.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    chunkFormat: 'commonjs',
  },
  optimization: { minimize: false, splitChunks: false, runtimeChunk: false },
  plugins: [new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 })],
};