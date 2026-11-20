#!/bin/sh
set -e

# Default ports if unset
PORT="${PORT:-80}"
NEXT_PORT="${NEXT_PORT:-3001}"
NEXT_URL="${NEXT_URL:-http://127.0.0.1:3001}"

echo "========================================================"
echo "  KAGEMI HYBRID PRODUCTION RUNNER (1-CLICK DOCKER)"
echo "  Gateway Public Port: $PORT"
echo "  Next.js Core Port  : $NEXT_PORT"
echo "========================================================"

# 1. Start Next.js standalone server on internal port
echo "[1/2] Booting Next.js engine on internal port $NEXT_PORT..."
HOSTNAME="127.0.0.1" PORT="$NEXT_PORT" node server.js &
NEXT_PID=$!

# Wait for Next.js to start
sleep 2

# 2. Start Go Streaming Gateway on public port
echo "[2/2] Booting Go Streaming Gateway on public port $PORT..."
PORT="$PORT" NEXT_URL="$NEXT_URL" /usr/local/bin/kagemi-gateway &
GO_PID=$!

# Signal handling for clean graceful shutdown
trap "echo 'Stopping Kagemi services...'; kill -TERM $GO_PID $NEXT_PID 2>/dev/null; wait $GO_PID $NEXT_PID" SIGTERM SIGINT

# Keep container alive by waiting for both processes
wait $GO_PID $NEXT_PID
