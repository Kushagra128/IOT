# Raspberry Pi 5 Setup Guide

Complete guide to run the Meeting Transcriber on Raspberry Pi 5 (Raspberry Pi OS - Debian-based)

## Hardware Requirements

- Raspberry Pi 5 (4GB+ RAM recommended)
- USB Microphone or USB Audio Interface
- MicroSD Card (32GB+ recommended)
- Power Supply (official 27W USB-C recommended)
- Internet connection for initial setup

## System Preparation

### 1. Update System

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install System Dependencies

```bash
# Python and development tools
sudo apt install -y python3 python3-pip python3-venv python3-dev

# Audio libraries
sudo apt install -y portaudio19-dev libasound2-dev

# Build tools for Python packages
sudo apt install -y build-essential gcc g++ make

# Node.js and npm (for frontend)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Git (if not already installed)
sudo apt install -y git
```

### 3. Configure Audio

```bash
# Test microphone
arecord -l

# Test recording (Ctrl+C to stop)
arecord -d 5 -f cd test.wav
aplay test.wav

# If needed, configure default audio device
sudo nano /etc/asound.conf
```

## Project Setup

### 1. Clone/Copy Project

```bash
cd ~
# If using git:
# git clone <your-repo-url> meeting-transcriber
# cd meeting-transcriber

# Or if copying from another machine, use the existing directory
cd /path/to/meeting-transcriber
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install Python dependencies
pip install -r requirements.txt

# Install PyAudio (may need special handling on ARM)
pip install pyaudio
```

**Note:** If PyAudio installation fails, try:
```bash
sudo apt install -y python3-pyaudio
pip install --no-cache-dir pyaudio
```

### 3. Download Vosk Model

```bash
cd ~/meeting-transcriber

# Download small English model (recommended for Pi 5)
wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip

# Extract
unzip vosk-model-small-en-us-0.15.zip

# Or use the Indian English model
# wget https://alphacephei.com/vosk/models/vosk-model-small-en-in-0.4.zip
# unzip vosk-model-small-en-in-0.4.zip
```

### 4. Update Configuration

Edit `iot-meeting-minutes/configs/recorder_config.yml`:

```yaml
model_path: /home/pi/meeting-transcriber/vosk-model-small-en-us-0.15
sample_rate: 16000
channels: 1
block_duration_ms: 500
save_dir: recordings
summarizer: textrank  # Use textrank on Pi, ollama requires more resources
extractive_sentences: 5
wav_format: PCM_16
mic_device_name: null
auto_summary_interval_seconds: 0
```

### 5. Frontend Setup

```bash
cd ~/meeting-transcriber/frontend

# Install dependencies
npm install

# Build for production (recommended for Pi)
npm run build
```

## Running the Application

### Option 1: Development Mode (Testing)

**Terminal 1 - Backend:**
```bash
cd ~/meeting-transcriber/backend
source venv/bin/activate
python3 app.py
```

**Terminal 2 - Frontend:**
```bash
cd ~/meeting-transcriber/frontend
npm run dev
```

Access at: `http://localhost:5173` or `http://<pi-ip>:5173`

### Option 2: Production Mode (Recommended)

**Backend with Gunicorn:**
```bash
cd ~/meeting-transcriber/backend
source venv/bin/activate
pip install gunicorn
gunicorn -w 2 -b 0.0.0.0:5000 --timeout 120 app:app
```

**Frontend - Serve Built Files:**
```bash
cd ~/meeting-transcriber/frontend
npm install -g serve
serve -s dist -l 3000
```

Access at: `http://<pi-ip>:3000`

## Performance Optimization

### 1. Reduce Memory Usage

Edit `backend/app.py` to limit workers:
```python
# Use fewer workers on Pi
# gunicorn -w 1 instead of -w 4
```

### 2. Use Lightweight Summarizer

In `iot-meeting-minutes/configs/recorder_config.yml`:
```yaml
summarizer: textrank  # Lighter than ollama or t5_small
```

### 3. Swap Space (if needed)

```bash
# Increase swap for 4GB Pi
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Set CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

## Autostart on Boot (Optional)

### Create Systemd Services

**Backend Service:**
```bash
sudo nano /etc/systemd/system/meeting-backend.service
```

```ini
[Unit]
Description=Meeting Transcriber Backend
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/meeting-transcriber/backend
Environment="PATH=/home/pi/meeting-transcriber/backend/venv/bin"
ExecStart=/home/pi/meeting-transcriber/backend/venv/bin/gunicorn -w 1 -b 0.0.0.0:5000 --timeout 120 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

**Enable and start:**
```bash
sudo systemctl enable meeting-backend
sudo systemctl start meeting-backend
sudo systemctl status meeting-backend
```

## Troubleshooting

### Audio Issues

```bash
# List audio devices
arecord -l

# Test microphone
arecord -d 5 -f S16_LE -r 16000 -c 1 test.wav
aplay test.wav

# Check ALSA configuration
cat /proc/asound/cards
```

### Memory Issues

```bash
# Monitor memory
free -h
htop

# Check swap
swapon --show
```

### PyAudio Issues

```bash
# Reinstall with system package
sudo apt install -y python3-pyaudio
pip uninstall pyaudio
pip install --no-cache-dir pyaudio
```

### Permission Issues

```bash
# Add user to audio group
sudo usermod -a -G audio $USER

# Reboot to apply
sudo reboot
```

### Vosk Model Issues

```bash
# Verify model directory structure
ls -la vosk-model-small-en-us-0.15/
# Should contain: am/, conf/, graph/, ivector/

# Update path in config
nano iot-meeting-minutes/configs/recorder_config.yml
```

## Network Access

To access from other devices on your network:

1. Find Pi's IP address:
```bash
hostname -I
```

2. Access application:
- Frontend: `http://<pi-ip>:3000`
- Backend API: `http://<pi-ip>:5000`

3. Update frontend API URL if needed:
Edit `frontend/vite.config.js` to point to Pi's IP.

## Performance Tips

1. **Use wired Ethernet** instead of WiFi for better stability
2. **Close unnecessary applications** to free up RAM
3. **Use lightweight desktop** (or run headless)
4. **Monitor temperature**: `vcgencmd measure_temp`
5. **Use active cooling** for sustained workloads

## Security Notes

- Change default passwords
- Use firewall (ufw) to restrict access
- Consider using HTTPS with nginx reverse proxy
- Don't expose to public internet without proper security

## Backup

```bash
# Backup database
cp meeting_transcriber.db meeting_transcriber.db.backup

# Backup recordings
tar -czf recordings_backup.tar.gz iot-meeting-minutes/recordings/
```
