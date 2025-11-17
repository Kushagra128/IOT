# 🚀 Quick Reference Card

## One-Command Startup

### On Raspberry Pi:

```bash
cd ~/meeting-transcriber
./run.sh
```

That's it! This will:
- ✅ Check if installed (runs install if needed)
- ✅ Start backend server
- ✅ Preload Vosk model into RAM
- ✅ Listen on network for connections

---

## Alternative Startup Methods

### Method 1: Backend Only (Recommended)
```bash
./start_backend.sh
```
- Starts backend on port 5000
- Access from laptop frontend

### Method 2: Backend + Frontend Together
```bash
./start_all.sh
```
- Starts backend on port 5000
- Starts frontend on port 3000
- Access at `http://<pi-ip>:3000`

### Method 3: Simple Run
```bash
./run.sh
```
- Auto-installs if needed
- Starts backend
- Easiest option!

---

## Essential Commands

### Raspberry Pi Commands:

```bash
# Get IP address
hostname -I

# Start backend
./start_backend.sh

# Start everything
./start_all.sh

# Test microphone
arecord -d 5 -f cd test.wav
aplay test.wav

# List audio devices
arecord -l

# Check if backend is running
ps aux | grep gunicorn

# Stop backend
pkill -f gunicorn

# View backend logs
tail -f /tmp/backend.log

# Check system resources
htop

# Check temperature
vcgencmd measure_temp
```

### Laptop Commands:

```bash
# Configure backend IP
cd frontend
./configure_frontend.sh

# Build frontend
npm run build

# Serve frontend
npm run serve

# Test backend connection
curl http://192.168.1.100:5000/api/health
```

---

## File Locations

### Configuration:
```
iot-meeting-minutes/configs/recorder_config.yml  # Audio & model settings
frontend/.env.production                          # Backend URL
```

### Recordings:
```
iot-meeting-minutes/recordings/user_<id>/        # User recordings
meeting_transcriber.db                            # Database
```

### Logs:
```
/tmp/backend.log                                  # Backend logs
/tmp/frontend.log                                 # Frontend logs
```

---

## Configuration Quick Edit

### Change Summarizer:
```bash
nano iot-meeting-minutes/configs/recorder_config.yml
# Change: summarizer: ollama
# Options: ollama, textrank, t5_small
```

### Change Backend IP (Laptop):
```bash
nano frontend/.env.production
# Set: VITE_API_URL=http://192.168.1.100:5000
```

---

## Troubleshooting Quick Fixes

### Backend won't start:
```bash
# Check port
lsof -i :5000

# Kill existing process
pkill -f gunicorn

# Restart
./start_backend.sh
```

### No microphone:
```bash
# List devices
arecord -l

# Add to audio group
sudo usermod -a -G audio $USER
sudo reboot
```

### Frontend can't connect:
```bash
# Get Pi IP
hostname -I

# Update frontend
cd frontend
nano .env.production
npm run build
```

### Empty transcript:
```bash
# Increase mic volume
alsamixer
# Press F4, use arrows to increase

# Test recording
arecord -d 5 -f S16_LE -r 16000 -c 1 test.wav
aplay test.wav
```

---

## URLs

### On Raspberry Pi:
- Backend API: `http://localhost:5000`
- Frontend: `http://localhost:3000`

### From Laptop (same WiFi):
- Backend API: `http://192.168.1.100:5000`
- Frontend: `http://192.168.1.100:3000`

Replace `192.168.1.100` with your Pi's actual IP

---

## System Status Check

```bash
# Quick health check
curl http://localhost:5000/api/health

# Check all services
ps aux | grep -E "gunicorn|serve"

# Check disk space
df -h

# Check memory
free -h

# Check temperature
vcgencmd measure_temp
```

---

## Recording Flow

1. **Start Backend** (Pi): `./start_backend.sh`
2. **Open Frontend** (Laptop): `http://localhost:3000`
3. **Login/Register**
4. **Click "Start Recording"**
5. **Speak into microphone** (connected to Pi)
6. **Watch live transcript** appear
7. **Click "Stop Recording"**
8. **View transcript & summary**
9. **Download PDF** (optional)

---

## Performance Tips

### For Better Performance:
```bash
# Use wired Ethernet instead of WiFi
# Close unnecessary apps
# Use active cooling
# Monitor temperature: vcgencmd measure_temp
```

### For Lighter Load:
```yaml
# Edit: iot-meeting-minutes/configs/recorder_config.yml
summarizer: textrank  # Instead of ollama
sample_rate: 8000     # Instead of 16000
```

---

## Backup Commands

```bash
# Backup database
cp meeting_transcriber.db meeting_transcriber.db.backup

# Backup recordings
tar -czf recordings_backup.tar.gz iot-meeting-minutes/recordings/

# Backup configuration
cp iot-meeting-minutes/configs/recorder_config.yml recorder_config.yml.backup
```

---

## Auto-Start on Boot

```bash
# Create systemd service
sudo nano /etc/systemd/system/meeting-backend.service
```

Paste:
```ini
[Unit]
Description=Meeting Transcriber Backend
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/meeting-transcriber
ExecStart=/home/pi/meeting-transcriber/start_backend.sh
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable meeting-backend
sudo systemctl start meeting-backend
```

---

## Quick Reinstall

```bash
cd ~/meeting-transcriber
./install_rpi.sh
```

---

## Emergency Reset

```bash
# Stop all services
pkill -f gunicorn
pkill -f serve

# Remove virtual environment
rm -rf backend/venv

# Reinstall
./install_rpi.sh
```

---

## Support

**Check logs first:**
```bash
tail -f /tmp/backend.log
```

**Test components:**
```bash
# Microphone
arecord -d 5 test.wav && aplay test.wav

# Backend
curl http://localhost:5000/api/health

# Network
ping 192.168.1.100
```

**Read documentation:**
- `START_HERE.md` - Quick start
- `RASPBERRY_PI_COMPLETE_GUIDE.md` - Full guide
- `TROUBLESHOOTING.md` - Detailed troubleshooting

---

## Most Common Commands

```bash
# Start backend
./run.sh

# Get IP
hostname -I

# Test mic
arecord -l

# Check status
ps aux | grep gunicorn

# View logs
tail -f /tmp/backend.log

# Stop backend
pkill -f gunicorn
```

---

## That's It!

**To start recording:**
1. Run `./run.sh` on Pi
2. Open `http://localhost:3000` on laptop
3. Start recording!

**Everything else is automatic!** 🎉
