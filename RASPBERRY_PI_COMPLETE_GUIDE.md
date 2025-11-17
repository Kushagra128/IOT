# 🚀 Complete Raspberry Pi Setup Guide - Ready to Run

This guide will get your Meeting Transcriber running on Raspberry Pi with your laptop as the frontend.

## 📋 What You Need

- **Raspberry Pi** (3B+, 4, or 5 recommended)
- **USB Microphone** connected to Raspberry Pi
- **Laptop** on the same WiFi network
- **Internet connection** for initial setup

---

## 🎯 Quick Start (5 Steps)

### Step 1: Transfer Project to Raspberry Pi

**Option A: Using USB Drive**
1. Copy the entire project folder to a USB drive
2. Insert USB into Raspberry Pi
3. Copy to home directory:
```bash
cp -r /media/pi/USB_DRIVE/meeting-transcriber ~/
cd ~/meeting-transcriber
```

**Option B: Using Git**
```bash
cd ~
git clone <your-repo-url> meeting-transcriber
cd meeting-transcriber
```

**Option C: Using SCP from your laptop**
```bash
# On your laptop
scp -r /path/to/meeting-transcriber pi@<raspberry-pi-ip>:~/
```

---

### Step 2: Run Automatic Installation

```bash
cd ~/meeting-transcriber
chmod +x install_rpi.sh
./install_rpi.sh
```

This script will:
- ✅ Update system packages
- ✅ Install Python, Node.js, and dependencies
- ✅ Download Vosk model automatically
- ✅ Set up backend virtual environment
- ✅ Build frontend
- ✅ Create startup scripts

**⏱️ Time: 15-20 minutes** (depending on internet speed)

---

### Step 3: Test Microphone

```bash
# List audio devices
arecord -l

# Record 5 seconds of audio
arecord -d 5 -f cd test.wav

# Play it back
aplay test.wav
```

If you hear your recording, microphone is working! ✅

---

### Step 4: Start Backend on Raspberry Pi

```bash
cd ~/meeting-transcriber
./start_backend.sh
```

You should see:
```
Starting backend server on http://0.0.0.0:5000
[INFO] Vosk model loaded successfully
[INFO] Backend ready to accept connections
```

**Keep this terminal open!** The backend must stay running.

---

### Step 5: Configure Frontend on Your Laptop

**On your laptop:**

1. **Find Raspberry Pi IP address** (from Pi terminal):
```bash
hostname -I
```
Example output: `192.168.1.100`

2. **Configure frontend** (on laptop):
```bash
cd frontend

# Windows
configure_frontend.bat

# Linux/Mac
./configure_frontend.sh
```

Enter your Raspberry Pi IP when prompted (e.g., `192.168.1.100`)

3. **Build and serve frontend** (on laptop):
```bash
npm install
npm run build
npm run serve
```

4. **Open browser** on laptop:
```
http://localhost:3000
```

---

## ✅ Verification Checklist

### On Raspberry Pi:
- [ ] Backend running: `./start_backend.sh` shows no errors
- [ ] Microphone detected: `arecord -l` shows your device
- [ ] Vosk model loaded: Backend log shows "Vosk model loaded"
- [ ] Network accessible: Backend listening on `0.0.0.0:5000`

### On Laptop:
- [ ] Frontend configured with Pi IP address
- [ ] Can access `http://localhost:3000`
- [ ] Can register/login
- [ ] Settings page shows "Connected successfully" to Pi

### Test Recording:
- [ ] Click "Start Recording" on laptop
- [ ] Speak into microphone connected to Raspberry Pi
- [ ] See live transcript appear on laptop screen
- [ ] Click "Stop Recording"
- [ ] View transcript and summary

---

## 🔧 Configuration Files

### Backend Configuration (Raspberry Pi)

**File:** `iot-meeting-minutes/configs/recorder_config.yml`

```yaml
# Vosk model path (auto-configured by install script)
model_path: /home/pi/meeting-transcriber/vosk-model-small-en-us-0.15

# Audio settings
sample_rate: 16000
channels: 1
block_duration_ms: 500

# Summarizer (ollama uses OpenRouter backend)
summarizer: ollama  # Options: ollama, textrank, t5_small

# For extractive summary
extractive_sentences: 5

# Recording directory
save_dir: recordings
```

**To change summarizer:**
```bash
nano iot-meeting-minutes/configs/recorder_config.yml
# Change: summarizer: ollama
# To: summarizer: textrank (for faster, offline summaries)
```

### Frontend Configuration (Laptop)

**File:** `frontend/.env.production`

```env
# Your Raspberry Pi IP address
VITE_API_URL=http://192.168.1.100:5000
```

**To update:**
```bash
# On laptop
cd frontend
nano .env.production
# Change IP to your Raspberry Pi's IP
```

---

## 🚀 Starting the System

### Method 1: Manual Start (Recommended for Testing)

**Terminal 1 (Raspberry Pi) - Backend:**
```bash
cd ~/meeting-transcriber
./start_backend.sh
```

**Terminal 2 (Laptop) - Frontend:**
```bash
cd frontend
npm run serve
```

### Method 2: Auto-start Backend on Pi Boot

```bash
# Create systemd service
sudo nano /etc/systemd/system/meeting-backend.service
```

Paste this:
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

Enable and start:
```bash
sudo systemctl enable meeting-backend
sudo systemctl start meeting-backend
sudo systemctl status meeting-backend
```

Now backend starts automatically when Pi boots! ✅

---

## 🎤 How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    Your WiFi Network                     │
│                                                           │
│  ┌──────────────────┐              ┌──────────────────┐ │
│  │   Your Laptop    │              │  Raspberry Pi    │ │
│  │                  │              │                  │ │
│  │  1. Open browser │              │  Backend Running │ │
│  │  2. Click "Start"│──── HTTP ───▶│  Port: 5000      │ │
│  │                  │   Request    │                  │ │
│  │  3. See live     │              │  🎤 Microphone   │ │
│  │     transcript   │◀──── JSON ───│  🧠 Vosk STT     │ │
│  │     on screen    │   Response   │  📝 Summarizer   │ │
│  │                  │              │                  │ │
│  └──────────────────┘              └──────────────────┘ │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Flow:**
1. You click "Start Recording" on laptop
2. Frontend sends request to `http://192.168.1.100:5000/api/recordings/start`
3. Raspberry Pi starts recording from its microphone
4. Vosk processes audio in real-time
5. Frontend polls for transcript updates every 2 seconds
6. Live transcript appears on your laptop screen
7. You click "Stop Recording"
8. Backend generates summary using Ollama (OpenRouter)
9. Frontend displays transcript and summary

---

## 🐛 Troubleshooting

### Problem: "Cannot connect to backend"

**Solution:**
```bash
# On Raspberry Pi - check if backend is running
ps aux | grep gunicorn

# If not running, start it
cd ~/meeting-transcriber
./start_backend.sh

# Check firewall
sudo ufw status
sudo ufw allow 5000/tcp

# Test from Pi itself
curl http://localhost:5000/api/health
```

### Problem: "No microphone detected"

**Solution:**
```bash
# List audio devices
arecord -l

# If no devices shown, check USB connection
lsusb

# Add user to audio group
sudo usermod -a -G audio $USER
sudo reboot

# Test recording
arecord -d 5 -f cd test.wav
aplay test.wav
```

### Problem: "Vosk model not found"

**Solution:**
```bash
# Check if model exists
ls -la ~/meeting-transcriber/vosk-model-small-en-us-0.15/

# If missing, download manually
cd ~/meeting-transcriber
wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
unzip vosk-model-small-en-us-0.15.zip

# Update config
nano iot-meeting-minutes/configs/recorder_config.yml
# Set: model_path: /home/pi/meeting-transcriber/vosk-model-small-en-us-0.15
```

### Problem: "Frontend can't connect to Pi"

**Solution:**
```bash
# On Raspberry Pi - find IP
hostname -I

# On laptop - test connection
ping 192.168.1.100
curl http://192.168.1.100:5000/api/health

# Update frontend config
cd frontend
nano .env.production
# Set: VITE_API_URL=http://192.168.1.100:5000

# Rebuild frontend
npm run build
npm run serve
```

### Problem: "Transcript is empty"

**Solution:**
```bash
# Check microphone volume
alsamixer
# Press F4 for capture, increase volume with arrow keys

# Test microphone
arecord -d 5 -f S16_LE -r 16000 -c 1 test.wav
aplay test.wav

# Check backend logs
cd ~/meeting-transcriber
./start_backend.sh
# Look for "[STT][final]" messages when speaking
```

### Problem: "Summary generation fails"

**Solution:**
```bash
# Switch to offline summarizer
nano iot-meeting-minutes/configs/recorder_config.yml
# Change: summarizer: ollama
# To: summarizer: textrank

# Restart backend
# Press Ctrl+C in backend terminal
./start_backend.sh
```

---

## 📊 Performance Tips

### For Raspberry Pi 3/4:
```yaml
# Use lighter summarizer
summarizer: textrank

# Reduce audio quality if needed
sample_rate: 8000  # Instead of 16000
```

### For Raspberry Pi 5:
```yaml
# Can use Ollama (OpenRouter backend)
summarizer: ollama

# Full quality audio
sample_rate: 16000
```

### Monitor Performance:
```bash
# CPU and memory usage
htop

# Temperature
vcgencmd measure_temp

# Disk space
df -h
```

---

## 🔒 Security Notes

1. **Change default passwords:**
```bash
passwd  # Change Pi password
```

2. **Firewall (optional):**
```bash
sudo apt install ufw
sudo ufw allow 5000/tcp
sudo ufw enable
```

3. **Don't expose to internet** - keep on local network only

---

## 📝 Quick Commands Reference

### Raspberry Pi Commands:
```bash
# Start backend
cd ~/meeting-transcriber && ./start_backend.sh

# Stop backend
# Press Ctrl+C in backend terminal

# Check backend status
ps aux | grep gunicorn

# View backend logs
cd ~/meeting-transcriber/backend
tail -f gunicorn.log

# Test microphone
arecord -d 5 -f cd test.wav && aplay test.wav

# Find IP address
hostname -I

# Restart Pi
sudo reboot
```

### Laptop Commands:
```bash
# Configure backend IP
cd frontend && ./configure_frontend.sh

# Build frontend
npm run build

# Serve frontend
npm run serve

# Open in browser
# http://localhost:3000
```

---

## ✨ You're Ready!

Your system is now fully configured:

1. ✅ Backend runs on Raspberry Pi (with microphone)
2. ✅ Frontend runs on your laptop
3. ✅ Both communicate over WiFi
4. ✅ Vosk transcribes speech in real-time
5. ✅ Ollama (OpenRouter) generates summaries
6. ✅ Everything is saved to database

**Start recording meetings now!** 🎉

---

## 📚 Additional Resources

- **Detailed Network Setup:** See `NETWORK_SETUP.md`
- **Deployment Checklist:** See `DEPLOYMENT_CHECKLIST.md`
- **Quick Start:** See `QUICK_START_NETWORK.md`
- **Raspberry Pi Details:** See `RASPBERRY_PI_SETUP.md`

---

## 🆘 Need Help?

1. Check the troubleshooting section above
2. Review backend logs on Raspberry Pi
3. Check browser console on laptop (F12)
4. Verify both devices are on same WiFi network
5. Test backend health: `curl http://<pi-ip>:5000/api/health`

**Common Issues:**
- Backend not running → Run `./start_backend.sh`
- Wrong IP address → Update `frontend/.env.production`
- Microphone not working → Run `arecord -l` and test
- No transcript → Check microphone volume with `alsamixer`
