#!/bin/bash

# Test script for Express OpenTelemetry sample app
# Usage: ./test.sh <iterations> [host]
# Example: ./test.sh 10
# Example: ./test.sh 50 localhost:3000

set -e

# Check if iteration count is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <iterations> [host]"
    echo "Example: $0 10"
    echo "Example: $0 50 localhost:3000"
    exit 1
fi

ITERATIONS=$1
HOST=${2:-localhost:8080}

echo "🚀 Starting test with $ITERATIONS iterations against $HOST"
echo "📊 Testing endpoints: /rolldice, /rolls"
echo "⏱️  Start time: $(date)"
echo ""

# Counter for successful requests
SUCCESS_COUNT=0
TOTAL_REQUESTS=0

for ((i=1; i<=ITERATIONS; i++)); do
    echo "🔄 Iteration $i/$ITERATIONS"
    
    # Test /rolldice endpoint
    echo "  🎲 Testing /rolldice..."
    TOTAL_REQUESTS=$((TOTAL_REQUESTS + 1))
    
    RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/rolldice_response.txt "http://$HOST/rolldice")
    HTTP_STATUS="${RESPONSE: -3}"
    BODY=$(cat /tmp/rolldice_response.txt)
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "     ✅ Status: $HTTP_STATUS, Response: $BODY"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo "     ❌ Status: $HTTP_STATUS, Response: $BODY"
    fi
    
    # Small delay between requests
    sleep 0.1
    
    # Test /rolls endpoint
    echo "  📋 Testing /rolls..."
    TOTAL_REQUESTS=$((TOTAL_REQUESTS + 1))
    
    RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/rolls_response.txt "http://$HOST/rolls")
    HTTP_STATUS="${RESPONSE: -3}"
    
    if [ "$HTTP_STATUS" = "200" ]; then
        # Extract count from JSON response
        COUNT=$(cat /tmp/rolls_response.txt | grep -o '"count":[0-9]*' | cut -d':' -f2)
        echo "     ✅ Status: $HTTP_STATUS, Rolls count: $COUNT"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        BODY=$(cat /tmp/rolls_response.txt)
        echo "     ❌ Status: $HTTP_STATUS, Response: $BODY"
    fi
    
    # Delay between iterations
    if [ $i -lt $ITERATIONS ]; then
        sleep 0.2
    fi
    
    echo ""
done

# Cleanup temp files
rm -f /tmp/rolldice_response.txt /tmp/rolls_response.txt

# Summary
echo "📈 Test Summary:"
echo "   Total requests: $TOTAL_REQUESTS"
echo "   Successful requests: $SUCCESS_COUNT"
echo "   Failed requests: $((TOTAL_REQUESTS - SUCCESS_COUNT))"
echo "   Success rate: $(echo "scale=2; $SUCCESS_COUNT * 100 / $TOTAL_REQUESTS" | bc -l)%"
echo "⏱️  End time: $(date)"

if [ $SUCCESS_COUNT -eq $TOTAL_REQUESTS ]; then
    echo "🎉 All tests passed!"
    exit 0
else
    echo "⚠️  Some tests failed!"
    exit 1
fi