#!/bin/bash
# Frontend Startup Script for Mac/Linux Laptop
# Connects to Raspberry Pi backend at http://10.124.101.100:5000

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}=========================================="
echo "  Meeting Transcriber Frontend"
echo "  Connecting to Raspberry Pi Backend"
echo "==========================================${NC}"
echo ""

cd frontend

# Check Node.js
echo -e "${CYAN}[1/3] Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}[ERROR] Node.js not found!${NC}"
    echo "Please install Node.js from: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}[OK] Node.js $(node --version)${NC}"
echo ""

# Install dependencies
echo -e "${CYAN}[2/3] Installing dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo "Installing packages... This may take a few minutes."
    npm install
else
    echo -e "${GREEN}[OK] Dependencies already installed${NC}"
fi
echo ""

# Start frontend
echo -e "${CYAN}[3/3] Starting frontend...${NC}"
echo ""
echo -e "${CYAN}=========================================="
echo "  Frontend Starting"
echo "==========================================${NC}"
echo ""
echo -e "${GREEN}Backend:${NC} http://10.124.101.100:5000"
echo -e "${GREEN}Frontend:${NC} http://localhost:5173"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

npm run dev
