#!/bin/bash
# Verification Script - Check if everything is ready
# Run this before starting the backend

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}=========================================="
echo "  System Verification Check"
echo "==========================================${NC}"
echo ""

ERRORS=0
WARNINGS=0

# Check 1: Vosk Model
echo -e "${CYAN}[1/7] Checking Vosk model...${NC}"
MODEL_PATH="/home/admin/iot2/models/vosk-model-en-in-0.5"

if [ -d "$MODEL_PATH" ]; then
    echo -e "${GREEN}✓ Vosk model found${NC}"
    
    # Check model structure
    if [ -f "$MODEL_PATH/am/final.mdl" ] && [ -d "$MODEL_PATH/conf" ] && [ -d "$MODEL_PATH/graph" ]; then
        echo -e "${GREEN}✓ Model structure is valid${NC}"
    else
        echo -e "${YELLOW}⚠️  Warning: Model structure incomplete${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}❌ Vosk model NOT found at: $MODEL_PATH${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 2: Backend files
echo -e "${CYAN}[2/7] Checking backend files...${NC}"
if [ -f "backend/app.py" ] && [ -f "backend/recording_service.py" ]; then
    echo -e "${GREEN}✓ Backend files present${NC}"
else
    echo -e "${RED}❌ Backend files missing${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 3: Virtual environment
echo -e "${CYAN}[3/7] Checking virtual environment...${NC}"
if [ -d "backend/venv" ]; then
    echo -e "${GREEN}✓ Virtual environment exists${NC}"
else
    echo -e "${YELLOW}⚠️  Virtual environment not found (will be created during install)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 4: Configuration file
echo -e "${CYAN}[4/7] Checking configuration...${NC}"
CONFIG_FILE="iot-meeting-minutes/configs/recorder_config.yml"
if [ -f "$CONFIG_FILE" ]; then
    echo -e "${GREEN}✓ Configuration file found${NC}"
    
    # Check if model path is correct
    CONFIG_MODEL=$(grep "model_path:" "$CONFIG_FILE" | awk '{print $2}')
    if [ "$CONFIG_MODEL" == "$MODEL_PATH" ]; then
        echo -e "${GREEN}✓ Model path correctly configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Model path in config: $CONFIG_MODEL${NC}"
        echo -e "${YELLOW}   Expected: $MODEL_PATH${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}❌ Configuration file missing${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 5: Microphone
echo -e "${CYAN}[5/7] Checking microphone...${NC}"
if arecord -l &> /dev/null; then
    MIC_COUNT=$(arecord -l | grep -c "card")
    echo -e "${GREEN}✓ Found $MIC_COUNT audio device(s)${NC}"
    arecord -l | grep "card" | head -n 3
else
    echo -e "${YELLOW}⚠️  No audio devices detected${NC}"
    echo "   Please connect a USB microphone"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 6: Python
echo -e "${CYAN}[6/7] Checking Python...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓ $PYTHON_VERSION${NC}"
else
    echo -e "${RED}❌ Python 3 not found${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 7: Network
echo -e "${CYAN}[7/7] Checking network...${NC}"
IP_ADDRESS=$(hostname -I | awk '{print $1}')
if [ -n "$IP_ADDRESS" ]; then
    echo -e "${GREEN}✓ Network configured${NC}"
    echo -e "  IP Address: ${CYAN}$IP_ADDRESS${NC}"
    echo -e "  Backend URL: ${CYAN}http://$IP_ADDRESS:5000${NC}"
else
    echo -e "${YELLOW}⚠️  No network IP found${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Summary
echo -e "${CYAN}=========================================="
echo "  Verification Summary"
echo "==========================================${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo -e "${GREEN}✅ System is ready to run!${NC}"
    echo ""
    echo -e "${CYAN}Next step:${NC}"
    echo "  ./start_backend.sh"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found${NC}"
    echo -e "${GREEN}✓ System should work, but check warnings above${NC}"
    echo ""
    echo -e "${CYAN}You can proceed with:${NC}"
    echo "  ./start_backend.sh"
else
    echo -e "${RED}❌ $ERRORS error(s) found${NC}"
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found${NC}"
    echo ""
    echo -e "${RED}Please fix errors before starting backend${NC}"
    echo ""
    echo -e "${CYAN}Common fixes:${NC}"
    echo "  - Run: ./install_backend_only.sh"
    echo "  - Check Vosk model location"
    echo "  - Verify all files transferred correctly"
fi

echo ""
