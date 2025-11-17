#!/bin/bash
# Complete System Startup Script
# Starts both backend and frontend automatically

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo -e "${CYAN}=========================================="
echo "  Meeting Transcriber - Full System Start"
echo "==========================================${NC}"
echo ""

# Get IP address
IP_ADDRESS=$(hostname -I | awk '{print $1}')

echo -e "${GREEN}System Information:${NC}"
echo "  Raspberry Pi IP: $IP_ADDRESS"
echo "  Backend URL: http://$IP_ADDRESS:5000"
echo "  Frontend URL: http://$IP_ADDRESS:3000"
echo ""

# Check if frontend is built
if [ ! -d "$SCRIPT_DIR/frontend/dist" ]; then
    echo -e "${YELLOW}Frontend not built yet. Building...${NC}"
    cd "$SCRIPT_DIR/frontend"
    npm install
    npm run build
    echo -e "${GREEN}✓ Frontend built${NC}"
    echo ""
fi

# Check if serve is installed
if ! command -v serve &> /dev/null; then
    echo -e "${YELLOW}Installing 'serve' for frontend...${NC}"
    sudo npm install -g serve
    echo -e "${GREEN}✓ Serve installed${NC}"
    echo ""
fi

echo -e "${CYAN}Starting services...${NC}"
echo ""

# Start backend in background
echo -e "${BLUE}[1/2] Starting backend...${NC}"
"$SCRIPT_DIR/start_backend.sh" > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"

# Wait for backend to be ready
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is ready!${NC}"
        break
    fi
    sleep 1
    echo -n "."
done
echo ""

# Start frontend in background
echo -e "${BLUE}[2/2] Starting frontend...${NC}"
cd "$SCRIPT_DIR/frontend"
serve -s dist -l 3000 > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
echo ""

# Display access information
echo -e "${CYAN}=========================================="
echo "  System Ready!"
echo "==========================================${NC}"
echo ""
echo -e "${GREEN}Access the application:${NC}"
echo ""
echo -e "  ${CYAN}On this Raspberry Pi:${NC}"
echo -e "    http://localhost:3000"
echo ""
echo -e "  ${CYAN}From your laptop (same WiFi):${NC}"
echo -e "    http://$IP_ADDRESS:3000"
echo ""
echo -e "${YELLOW}Backend API:${NC}"
echo -e "    http://$IP_ADDRESS:5000"
echo ""
echo -e "${GREEN}Logs:${NC}"
echo -e "  Backend:  tail -f /tmp/backend.log"
echo -e "  Frontend: tail -f /tmp/frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping services...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}✓ All services stopped${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT TERM

# Keep script running and show logs
echo -e "${CYAN}------------------------------------------${NC}"
echo -e "${CYAN}Live Backend Logs (Ctrl+C to stop):${NC}"
echo -e "${CYAN}------------------------------------------${NC}"
echo ""

# Follow backend logs
tail -f /tmp/backend.log
