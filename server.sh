#!/usr/bin/env bash
# ==============================================================================
# Sunveil Interactive Kanban & Mindmap - Linux/macOS Server Runner
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PID_FILE="$SCRIPT_DIR/data/sunveil.pid"
PORT="${PORT:-40293}"

# Ensure data directory exists
mkdir -p "$SCRIPT_DIR/data/boards"

# Check Node.js installation
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Error: Node.js is not installed or not in PATH."
    echo "Please install Node.js (v18+) to run Sunveil Server."
    exit 1
fi

case "$1" in
    start)
        if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
            echo "⚠️ Sunveil Server is already running (PID: $(cat "$PID_FILE"))."
            exit 0
        fi
        echo "🚀 Starting Sunveil Server on port $PORT (Daemon Mode)..."
        export SUNVEIL_SERVER=true
        export NODE_ENV=production
        export PORT="$PORT"
        nohup node server.js --server > "$SCRIPT_DIR/data/server.log" 2>&1 &
        echo $! > "$PID_FILE"
        echo "✅ Sunveil Server started with PID $(cat "$PID_FILE")."
        echo "🌐 Access: http://localhost:$PORT/ or http://$(hostname -I 2>/dev/null | awk '{print $1}'):$PORT/"
        ;;

    stop)
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if kill -0 "$PID" 2>/dev/null; then
                echo "🛑 Stopping Sunveil Server (PID: $PID)..."
                kill "$PID"
                rm -f "$PID_FILE"
                echo "✅ Server stopped."
            else
                echo "⚠️ Server process $PID is not running. Removing stale PID file."
                rm -f "$PID_FILE"
            fi
        else
            echo "⚠️ No PID file found. Server is not running."
        fi
        ;;

    status)
        if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
            echo "✅ Sunveil Server is RUNNING (PID: $(cat "$PID_FILE"), Port: $PORT)."
        else
            echo "⚪ Sunveil Server is STOPPED."
        fi
        ;;

    log|logs)
        tail -f "$SCRIPT_DIR/data/server.log"
        ;;

    run|foreground|*)
        echo "🚀 Running Sunveil Server in foreground..."
        export SUNVEIL_SERVER=true
        export NODE_ENV=production
        export PORT="$PORT"
        exec node server.js --server
        ;;
esac
