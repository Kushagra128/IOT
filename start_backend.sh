#!/bin/bash
# Complete Backend Startup Script for Raspberry Pi
# This script handles everything: environment setup, model loading, and server start

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
VENV_DIR="$BACKEND_DIR/venv"
CONFIG_FILE="$SCRIPT_DIR/iot-meeting-minutes/configs/recorder_config.yml"

echo ""
echo -e "${CYAN}=========================================="
echo "  Meeting Transcriber Backend Startup"
echo "==========================================${NC}"
echo ""

# Function to check if port is in use
check_port() {
    if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}⚠️  Port 5000 is already in use!${NC}"
        echo ""
        echo "Another backend instance may be running."
        read -p "Kill existing process and continue? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Stopping existing backend...${NC}"
            lsof -ti:5000 | xargs kill -9 2>/dev/null || true
            sleep 2
        else
            echo -e "${RED}Exiting. Please stop the existing backend first.${NC}"
            exit 1
        fi
    fi
}

# Function to check system requirements
check_requirements() {
    echo -e "${BLUE}[1/7] Checking system requirements...${NC}"
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python 3 not found!${NC}"
        echo "Install with: sudo apt install python3"
        exit 1
    fi
    echo -e "${GREEN}✓ Python 3: $(python3 --version)${NC}"
    
    # Check virtual environment
    if [ ! -d "$VENV_DIR" ]; then
        echo -e "${YELLOW}⚠️  Virtual environment not found!${NC}"
        echo "Creating virtual environment..."
        cd "$BACKEND_DIR"
        python3 -m venv venv
        echo -e "${GREEN}✓ Virtual environment created${NC}"
    else
        echo -e "${GREEN}✓ Virtual environment exists${NC}"
    fi
    
    # Check microphone
    if ! arecord -l &> /dev/null; then
        echo -e "${YELLOW}⚠️  Warning: No audio devices detected${NC}"
        echo "Please connect a USB microphone"
    else
        echo -e "${GREEN}✓ Audio devices detected:${NC}"
        arecord -l | grep "card" | head -n 3
    fi
    
    echo ""
}

# Function to activate virtual environment and install dependencies
setup_environment() {
    echo -e "${BLUE}[2/7] Setting up Python environment...${NC}"
    
    cd "$BACKEND_DIR"
    
    # Activate virtual environment
    if [ -f "$VENV_DIR/bin/activate" ]; then
        source "$VENV_DIR/bin/activate"
        echo -e "${GREEN}✓ Virtual environment activated${NC}"
    else
        echo -e "${RED}❌ Cannot activate virtual environment!${NC}"
        exit 1
    fi
    
    # Check if dependencies are installed
    if ! python -c "import flask" &> /dev/null; then
        echo -e "${YELLOW}Installing Python dependencies...${NC}"
        pip install --upgrade pip -q
        pip install -r requirements_rpi.txt -q
        echo -e "${GREEN}✓ Dependencies installed${NC}"
    else
        echo -e "${GREEN}✓ Dependencies already installed${NC}"
    fi
    
    echo ""
}

# Function to check Vosk model
check_vosk_model() {
    echo -e "${BLUE}[3/7] Checking Vosk model...${NC}"
    
    # Read model path from config
    if [ -f "$CONFIG_FILE" ]; then
        MODEL_PATH=$(grep "model_path:" "$CONFIG_FILE" | awk '{print $2}')
        
        if [ -d "$MODEL_PATH" ]; then
            echo -e "${GREEN}✓ Vosk model found: $MODEL_PATH${NC}"
            
            # Check model structure
            if [ -f "$MODEL_PATH/am/final.mdl" ]; then
                echo -e "${GREEN}✓ Model structure valid${NC}"
            else
                echo -e "${YELLOW}⚠️  Warning: Model structure may be incomplete${NC}"
            fi
        else
            echo -e "${RED}❌ Vosk model not found at: $MODEL_PATH${NC}"
            echo ""
            echo "Please download the model:"
            echo "  cd $SCRIPT_DIR"
            echo "  wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
            echo "  unzip vosk-model-small-en-us-0.15.zip"
            echo ""
            echo "Or run: ./install_rpi.sh"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  Config file not found: $CONFIG_FILE${NC}"
    fi
    
    echo ""
}

# Function to check database
check_database() {
    echo -e "${BLUE}[4/7] Checking database...${NC}"
    
    DB_FILE="$SCRIPT_DIR/meeting_transcriber.db"
    
    if [ -f "$DB_FILE" ]; then
        echo -e "${GREEN}✓ Database exists: $DB_FILE${NC}"
        DB_SIZE=$(du -h "$DB_FILE" | cut -f1)
        echo -e "${GREEN}  Size: $DB_SIZE${NC}"
    else
        echo -e "${YELLOW}⚠️  Database will be created on first run${NC}"
    fi
    
    echo ""
}

# Function to check network configuration
check_network() {
    echo -e "${BLUE}[5/7] Checking network configuration...${NC}"
    
    # Get IP addresses
    IP_ADDRESSES=$(hostname -I)
    FIRST_IP=$(echo $IP_ADDRESSES | awk '{print $1}')
    
    echo -e "${GREEN}✓ Network interfaces:${NC}"
    echo "  IP Addresses: $IP_ADDRESSES"
    echo ""
    echo -e "${CYAN}Backend will be accessible at:${NC}"
    echo -e "${GREEN}  • Local:   http://localhost:5000${NC}"
    echo -e "${GREEN}  • Network: http://$FIRST_IP:5000${NC}"
    echo ""
    echo -e "${YELLOW}📱 Configure your laptop frontend with:${NC}"
    echo -e "${CYAN}  VITE_API_URL=http://$FIRST_IP:5000${NC}"
    echo ""
}

# Function to display configuration
show_configuration() {
    echo -e "${BLUE}[6/7] Current configuration:${NC}"
    
    if [ -f "$CONFIG_FILE" ]; then
        echo -e "${GREEN}Sample Rate:${NC} $(grep "sample_rate:" "$CONFIG_FILE" | awk '{print $2}') Hz"
        echo -e "${GREEN}Channels:${NC} $(grep "channels:" "$CONFIG_FILE" | awk '{print $2}')"
        echo -e "${GREEN}Summarizer:${NC} $(grep "summarizer:" "$CONFIG_FILE" | awk '{print $2}')"
    fi
    
    echo ""
}

# Function to start the backend server
start_server() {
    echo -e "${BLUE}[7/7] Starting backend server...${NC}"
    echo ""
    echo -e "${CYAN}=========================================="
    echo "  Backend Server Starting"
    echo "==========================================${NC}"
    echo ""
    echo -e "${GREEN}✓ Vosk model will be preloaded into RAM${NC}"
    echo -e "${GREEN}✓ Recording will start instantly${NC}"
    echo -e "${GREEN}✓ Real-time transcription enabled${NC}"
    echo -e "${GREEN}✓ AI summarization ready${NC}"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
    echo ""
    echo -e "${CYAN}------------------------------------------${NC}"
    echo ""
    
    cd "$BACKEND_DIR"
    
    # Check if gunicorn is installed
    if command -v gunicorn &> /dev/null; then
        # Production mode with gunicorn
        echo -e "${GREEN}Starting with Gunicorn (production mode)...${NC}"
        echo ""
        gunicorn -w 1 \
                 -b 0.0.0.0:5000 \
                 --timeout 120 \
                 --access-logfile - \
                 --error-logfile - \
                 --log-level info \
                 app:app
    else
        # Development mode with Flask
        echo -e "${YELLOW}Starting with Flask (development mode)...${NC}"
        echo -e "${YELLOW}For production, install gunicorn: pip install gunicorn${NC}"
        echo ""
        python3 app.py
    fi
}

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down backend...${NC}"
    echo -e "${GREEN}✓ Backend stopped${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT TERM

# Main execution
main() {
    # Check if port is already in use
    check_port
    
    # Run all checks
    check_requirements
    setup_environment
    check_vosk_model
    check_database
    check_network
    show_configuration
    
    # Start the server
    start_server
}

# Run main function
main
