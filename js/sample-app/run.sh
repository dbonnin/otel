docker build -t express-otel-app .
docker run --rm -d -p 8080:8080 express-otel-app