const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './otel-entry.ts', // imports ADOT register, then ./app
  target: 'node',
  mode: 'production',
  module: { rules: [{ test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ }] },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@opentelemetry/exporter-jaeger': false,
      '@opentelemetry/winston-transport': false,
    },
  },
  // Externalize libs that need runtime patching
  externalsType: 'commonjs',
  externals: [
    /^@aws-sdk\//,
    'express',
    'http',
    'https',
    /^@opentelemetry\//,
    '@aws/aws-distro-opentelemetry-node-autoinstrumentation/register',
    'require-in-the-middle',
  ],
  output: {
    filename: 'app-otel.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    chunkFormat: 'commonjs',
  },
  optimization: { minimize: false, splitChunks: false, runtimeChunk: false },
  plugins: [new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 })],
  ignoreWarnings: [/Critical dependency: the request of a dependency is an expression/],
};