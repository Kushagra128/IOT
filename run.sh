#!/bin/bash
# Simple one-command startup script
# Just run: ./run.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Make scripts executable
chmod +x "$SCRIPT_DIR/start_backend.sh"
chmod +x "$SCRIPT_DIR/start_all.sh"
chmod +x "$SCRIPT_DIR/install_rpi.sh"

# Check if installed
if [ ! -d "$SCRIPT_DIR/backend/venv" ]; then
    echo "=========================================="
    echo "  First Time Setup Required"
    echo "=========================================="
    echo ""
    echo "Running installation script..."
    echo ""
    "$SCRIPT_DIR/install_rpi.sh"
fi

# Start backend only (recommended)
echo ""
echo "Starting backend server..."
echo ""
"$SCRIPT_DIR/start_backend.sh"
