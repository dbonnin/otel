# --- Build stage: produce dist/app-fat.js ---
FROM node:22-alpine AS build
WORKDIR /app

# Install deps for building
COPY package*.json ./
RUN npm ci || npm install

# Copy build configs and sources
COPY tsconfig.json webpack.fat.config.js ./
COPY *.ts ./

# Build fat bundle (single file)
RUN npm run build:fat

# --- Runtime stage: run fat bundle + ADOT ---
FROM node:22-alpine AS runtime
WORKDIR /app

# Update system packages to patch vulnerabilities
RUN apk update && apk upgrade

# Minimal runtime: only install ADOT auto-instrumentation
RUN npm init -y && npm i --omit=dev @aws/aws-distro-opentelemetry-node-autoinstrumentation

# Copy the fat bundle
COPY --from=build /app/dist/app-fat.js ./dist/app-fat.js

# OTEL config (adjust endpoint as needed)
ENV NODE_ENV=production \
  NODE_OPTIONS="--require @aws/aws-distro-opentelemetry-node-autoinstrumentation/register" \
  OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 \
  OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf \
  OTEL_RESOURCE_ATTRIBUTES=service.name=express-fat-otel-app-v3,service.version=3.0.0,aws.region=us-east-1 \
  OTEL_SERVICE_NAME=express-otel-app-fat-otel-v3 \
  OTEL_LOG_LEVEL=debug

EXPOSE 8080
CMD ["node", "dist/app-fat.js"]