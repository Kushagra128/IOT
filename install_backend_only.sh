#!/bin/bash
# Backend-Only Installation Script for Raspberry Pi
# This installs ONLY the backend - frontend runs on your laptop
# Run with: bash install_backend_only.sh

set -e  # Exit on error

echo "=========================================="
echo "  Backend Installation for Raspberry Pi"
echo "  (Frontend will run on your laptop)"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on Raspberry Pi
if [ ! -f /proc/device-tree/model ] || ! grep -q "Raspberry Pi" /proc/device-tree/model; then
    echo -e "${YELLOW}Warning: This doesn't appear to be a Raspberry Pi${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Update system
echo -e "${GREEN}[1/6] Updating system...${NC}"
sudo apt update
sudo apt upgrade -y

# Install system dependencies (backend only - no Node.js)
echo -e "${GREEN}[2/6] Installing system dependencies...${NC}"
sudo apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    portaudio19-dev \
    libasound2-dev \
    build-essential \
    gcc \
    g++ \
    make \
    wget \
    unzip \
    ffmpeg

# Setup backend
echo -e "${GREEN}[3/6] Setting up backend...${NC}"
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install Python dependencies
echo "Installing Python packages..."
pip install -r requirements_rpi.txt

# Try to install PyAudio
echo "Installing PyAudio..."
if ! pip install pyaudio; then
    echo -e "${YELLOW}PyAudio pip install failed, trying system package...${NC}"
    sudo apt install -y python3-pyaudio
fi

cd ..

# Check if Vosk model exists
echo -e "${GREEN}[4/6] Checking Vosk model...${NC}"

# Expected model path (configured for your system)
MODEL_PATH="/home/admin/iot2/models/vosk-model-en-in-0.5"

if [ -d "$MODEL_PATH" ]; then
    echo -e "${GREEN}✓ Vosk model found at: $MODEL_PATH${NC}"
    
    # Verify model structure
    if [ -f "$MODEL_PATH/am/final.mdl" ]; then
        echo -e "${GREEN}✓ Model structure is valid${NC}"
    else
        echo -e "${YELLOW}⚠️  Warning: Model structure may be incomplete${NC}"
        echo "Expected files: am/final.mdl, conf/, graph/, ivector/"
    fi
else
    echo -e "${RED}❌ Vosk model NOT found at: $MODEL_PATH${NC}"
    echo ""
    echo "Please ensure your Vosk model is at:"
    echo "  $MODEL_PATH"
    echo ""
    echo "Current config expects: /home/admin/iot2/models/vosk-model-en-in-0.5"
    echo ""
    exit 1
fi

# Test audio
echo -e "${GREEN}[5/6] Testing audio setup...${NC}"
echo "Available audio devices:"
arecord -l || echo -e "${YELLOW}No audio devices found${NC}"

# Create startup script
echo -e "${GREEN}[6/6] Creating startup script...${NC}"

cat > start_backend.sh << 'EOF'
#!/bin/bash
# Backend Startup Script
# This script starts ONLY the backend server

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
VENV_DIR="$BACKEND_DIR/venv"

echo ""
echo -e "${CYAN}=========================================="
echo "  Meeting Transcriber Backend"
echo "==========================================${NC}"
echo ""

# Check if port is in use
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Port 5000 is already in use!${NC}"
    read -p "Kill existing process? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        lsof -ti:5000 | xargs kill -9 2>/dev/null || true
        sleep 2
    else
        exit 1
    fi
fi

# Activate virtual environment
cd "$BACKEND_DIR"
if [ -f "$VENV_DIR/bin/activate" ]; then
    source "$VENV_DIR/bin/activate"
    echo -e "${GREEN}✓ Virtual environment activated${NC}"
else
    echo -e "${RED}❌ Virtual environment not found!${NC}"
    exit 1
fi

# Get IP address
IP_ADDRESS=$(hostname -I | awk '{print $1}')

echo -e "${GREEN}✓ Backend will be accessible at:${NC}"
echo -e "  Local:   ${CYAN}http://localhost:5000${NC}"
echo -e "  Network: ${CYAN}http://$IP_ADDRESS:5000${NC}"
echo ""
echo -e "${YELLOW}📱 Configure your laptop frontend with:${NC}"
echo -e "  ${CYAN}VITE_API_URL=http://$IP_ADDRESS:5000${NC}"
echo ""
echo -e "${GREEN}✓ Vosk model will be preloaded into RAM${NC}"
echo -e "${GREEN}✓ Recording will start instantly${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""
echo -e "${CYAN}------------------------------------------${NC}"
echo ""

# Start server
if command -v gunicorn &> /dev/null; then
    gunicorn -w 1 -b 0.0.0.0:5000 --timeout 120 app:app
else
    python3 app.py
fi
EOF

chmod +x start_backend.sh

echo ""
echo -e "${GREEN}=========================================="
echo "Installation Complete!"
echo "==========================================${NC}"
echo ""
echo -e "${GREEN}=========================================="
echo "Backend installed successfully!"
echo "==========================================${NC}"
echo ""
echo -e "${GREEN}✓ Vosk model configured at:${NC}"
echo "  /home/admin/iot2/models/vosk-model-en-in-0.5"
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo "1. Start backend: ./start_backend.sh"
echo "2. Note your Pi IP address (shown below)"
echo "3. Configure laptop frontend with Pi IP"
echo ""
echo -e "${YELLOW}Your Raspberry Pi IP:${NC} $(hostname -I | awk '{print $1}')"
echo ""
echo -e "${CYAN}Backend will run on:${NC} http://$(hostname -I | awk '{print $1}'):5000"
echo ""
echo -e "${GREEN}Ready to start recording!${NC}"
echo ""

