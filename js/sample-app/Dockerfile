FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY app.ts instrumentation.ts ./

ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://host.docker.internal:4318
ENV OTEL_SERVICE_NAME=express-otel-app
ENV OTEL_SERVICE_VERSION=1.0.0

EXPOSE 8080

CMD ["npx", "tsx", "--import", "./instrumentation.ts", "app.ts"]