#!/bin/bash
# Raspberry Pi 5 Installation Script
# Run with: bash install_rpi.sh

set -e  # Exit on error

echo "=========================================="
echo "Meeting Transcriber - Raspberry Pi Setup"
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
echo -e "${GREEN}[1/8] Updating system...${NC}"
sudo apt update
sudo apt upgrade -y

# Install system dependencies
echo -e "${GREEN}[2/8] Installing system dependencies...${NC}"
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
    git \
    wget \
    unzip

# Install Node.js
echo -e "${GREEN}[3/8] Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js already installed: $(node --version)"
fi

# Setup backend
echo -e "${GREEN}[4/8] Setting up backend...${NC}"
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

# Download Vosk model
echo -e "${GREEN}[5/8] Downloading Vosk model...${NC}"
VOSK_MODEL="vosk-model-small-en-us-0.15"
if [ ! -d "$VOSK_MODEL" ]; then
    echo "Downloading $VOSK_MODEL..."
    wget -q --show-progress https://alphacephei.com/vosk/models/${VOSK_MODEL}.zip
    unzip -q ${VOSK_MODEL}.zip
    rm ${VOSK_MODEL}.zip
    echo "Model downloaded and extracted"
else
    echo "Vosk model already exists"
fi

# Update config with correct model path
echo -e "${GREEN}[6/8] Updating configuration...${NC}"
MODEL_PATH="$(pwd)/$VOSK_MODEL"
sed -i "s|model_path:.*|model_path: $MODEL_PATH|g" iot-meeting-minutes/configs/recorder_config.yml
echo "Configuration updated with model path: $MODEL_PATH"
echo "Summarizer set to: ollama (using OpenRouter backend)"

# Setup frontend
echo -e "${GREEN}[7/8] Setting up frontend...${NC}"
cd frontend
npm install
echo "Building frontend for production..."
npm run build
cd ..

# Test audio
echo -e "${GREEN}[8/8] Testing audio setup...${NC}"
echo "Available audio devices:"
arecord -l || echo -e "${YELLOW}No audio devices found${NC}"

# Create startup scripts
echo -e "${GREEN}Creating startup scripts...${NC}"

# Backend startup script
cat > start_backend.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/backend"
source venv/bin/activate
echo "Starting backend server on http://0.0.0.0:5000"
gunicorn -w 1 -b 0.0.0.0:5000 --timeout 120 app:app
EOF
chmod +x start_backend.sh

# Frontend startup script
cat > start_frontend.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/frontend"
if ! command -v serve &> /dev/null; then
    echo "Installing serve..."
    sudo npm install -g serve
fi
echo "Starting frontend server on http://0.0.0.0:3000"
serve -s dist -l 3000
EOF
chmod +x start_frontend.sh

# Combined startup script
cat > start_all.sh << 'EOF'
#!/bin/bash
echo "Starting Meeting Transcriber..."
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Start backend in background
./start_backend.sh &
BACKEND_PID=$!

# Start frontend in background
./start_frontend.sh &
FRONTEND_PID=$!

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
EOF
chmod +x start_all.sh

# Make all scripts executable
echo -e "${GREEN}Making scripts executable...${NC}"
chmod +x start_backend.sh
chmod +x start_all.sh
chmod +x start_frontend.sh
chmod +x run.sh
chmod +x configure_frontend.sh

echo ""
echo -e "${GREEN}=========================================="
echo "Installation Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Test microphone: arecord -d 5 -f cd test.wav && aplay test.wav"
echo "2. Start backend: ./start_backend.sh"
echo "3. Start frontend: ./start_frontend.sh"
echo "   OR start both: ./start_all.sh"
echo ""
echo "Access the application:"
echo "  - Frontend: http://$(hostname -I | awk '{print $1}'):3000"
echo "  - Backend API: http://$(hostname -I | awk '{print $1}'):5000"
echo ""
echo "For detailed instructions, see RASPBERRY_PI_SETUP.md"
echo ""
