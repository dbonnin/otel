docker build -t aws-otel .
docker run -p 4317:4317 -p 4318:4318 -v $(pwd)/otel-config.yml:/etc/otel-config.yml aws-otel