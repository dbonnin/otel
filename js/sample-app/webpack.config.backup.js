const path = require('path');
const webpack = require('webpack');

module.exports = {
  // Build two entry points: plain and OTEL-preloaded
  entry: {
    app: './app.ts',
    'app-otel': './otel-entry.ts',
  },
  target: 'node',
  mode: 'production',
  // No externals: bundle node_modules into the output
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    // Stub optional deps ADOT may conditionally require
    alias: {
      '@opentelemetry/exporter-jaeger': false,
      '@opentelemetry/winston-transport': false,
    },
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    chunkFormat: 'commonjs',
  },
  optimization: {
    minimize: false, // set to true if you want a smaller single file
    splitChunks: false,
    runtimeChunk: false,
  },
  // Force a single chunk per entry to avoid extra vendor files
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
  ],
  // Quiet the dynamic require warnings from instrumentation libs
  ignoreWarnings: [
    /Critical dependency: the request of a dependency is an expression/,
  ],
};