# 🎯 Raspberry Pi Backend-Only Setup

## What This Does

Installs **ONLY the backend** on Raspberry Pi. Frontend runs on your laptop.

---

## 📦 Step 1: Transfer Backend Files to Raspberry Pi

Transfer these folders/files to your Raspberry Pi:

```
meeting-transcriber/
├── backend/                    # Backend code
├── iot-meeting-minutes/        # Transcription engine
├── install_backend_only.sh     # Installation script
└── (documentation files)
```

**You DON'T need to transfer:**
- `frontend/` folder (stays on laptop)
- `node_modules/` (not needed on Pi)

---

## ⚙️ Step 2: Install Backend (ONE Command)

On Raspberry Pi:

```bash
cd ~/meeting-transcriber
chmod +x install_backend_only.sh
./install_backend_only.sh
```

**This installs:**
- ✅ Python 3 and dependencies
- ✅ Audio libraries (PortAudio, ALSA)
- ✅ Backend Python packages
- ✅ Creates virtual environment
- ✅ Creates startup script

**Time:** 10-15 minutes

**Does NOT install:**
- ❌ Node.js (not needed on Pi)
- ❌ Frontend dependencies
- ❌ Vosk model (you already have it)

---

## 📝 Step 3: Update Vosk Model Path

### Where to Update:

**File:** `iot-meeting-minutes/configs/recorder_config.yml`

```bash
nano iot-meeting-minutes/configs/recorder_config.yml
```

### What to Change:

Find this line:
```yaml
model_path: /home/pi/vosk-model-small-en-us-0.15
```

Change it to YOUR Vosk model location:
```yaml
model_path: /home/pi/YOUR_VOSK_MODEL_FOLDER
```

**Examples:**
```yaml
# If your model is in home directory:
model_path: /home/pi/vosk-model-small-en-us-0.15

# If in Downloads:
model_path: /home/pi/Downloads/vosk-model-small-en-us-0.15

# If in meeting-transcriber folder:
model_path: /home/pi/meeting-transcriber/vosk-model-small-en-us-0.15

# Full path example:
model_path: /home/pi/vosk-model-small-en-in-0.4
```

### How to Find Your Model Path:

```bash
# Find where your Vosk model is
find ~ -name "vosk-model*" -type d

# Or if you know it's in a specific location
ls -la ~/vosk-model*
ls -la ~/Downloads/vosk-model*
```

### Complete Configuration File:

```yaml
# Audio settings
sample_rate: 16000
channels: 1
block_duration_ms: 500

# Vosk model path - UPDATE THIS!
model_path: /home/pi/vosk-model-small-en-us-0.15

# Recording directory
save_dir: recordings

# Summarizer (uses OpenRouter, displayed as "Ollama")
summarizer: ollama
# Options: ollama, textrank, t5_small

# Extractive summary settings
extractive_sentences: 5

# Other settings
wav_format: PCM_16
mic_device_name: null
auto_summary_interval_seconds: 0
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

---

## 🚀 Step 4: Start Backend

```bash
cd ~/meeting-transcriber
./start_backend.sh
```

**You'll see:**
```
==========================================
  Meeting Transcriber Backend
==========================================

✓ Virtual environment activated
✓ Backend will be accessible at:
  Local:   http://localhost:5000
  Network: http://192.168.1.100:5000

📱 Configure your laptop frontend with:
  VITE_API_URL=http://192.168.1.100:5000

✓ Vosk model will be preloaded into RAM
✓ Recording will start instantly

Press Ctrl+C to stop

------------------------------------------

🚀 PRELOADING VOSK MODEL INTO RAM...
   ✓ Vosk model successfully preloaded into RAM!

[INFO] Listening at: http://0.0.0.0:5000
```

**✅ Backend is running!**

**Note your Pi IP address** (e.g., `192.168.1.100`)

---

## 💻 Step 5: Configure Laptop Frontend

### On Your Laptop:

1. **Go to frontend folder:**
```bash
cd frontend
```

2. **Run configuration script:**
```bash
# Windows:
configure_frontend.bat

# Mac/Linux:
chmod +x configure_frontend.sh
./configure_frontend.sh
```

3. **Enter your Pi IP** when prompted (e.g., `192.168.1.100`)

4. **Build and start frontend:**
```bash
npm install
npm run build
npm run serve
```

5. **Open browser:**
```
http://localhost:3000
```

---

## ✅ Verification

### Test Backend Connection:

```bash
# From Raspberry Pi:
curl http://localhost:5000/api/health

# From your laptop:
curl http://192.168.1.100:5000/api/health
```

**Expected response:**
```json
{"status": "healthy", "message": "API is running"}
```

### Test Microphone:

```bash
# On Raspberry Pi:
arecord -l
arecord -d 5 -f cd test.wav
aplay test.wav
```

---

## 📁 Files on Raspberry Pi

```
~/meeting-transcriber/
├── backend/
│   ├── app.py
│   ├── recording_service.py
│   ├── database.py
│   ├── requirements_rpi.txt
│   └── venv/                    # Created by install script
│
├── iot-meeting-minutes/
│   ├── recorder.py
│   ├── stt_engine.py
│   ├── summarizer.py
│   └── configs/
│       └── recorder_config.yml  # ⭐ UPDATE MODEL PATH HERE
│
├── install_backend_only.sh      # Installation script
├── start_backend.sh             # Startup script (created by install)
└── meeting_transcriber.db       # Database (created on first run)
```

---

## 🔧 Configuration Reference

### recorder_config.yml Settings:

```yaml
# ⭐ MOST IMPORTANT - Update this!
model_path: /home/pi/YOUR_VOSK_MODEL_PATH

# Audio quality
sample_rate: 16000    # CD quality (16kHz)
channels: 1           # Mono

# Summarizer
summarizer: ollama    # AI summaries (OpenRouter)
# Options:
#   ollama    - AI summaries (best quality, needs internet)
#   textrank  - Extractive summaries (offline, faster)
#   t5_small  - Local AI (needs more RAM)

# Recording location
save_dir: recordings  # Relative to iot-meeting-minutes/
```

---

## 🐛 Troubleshooting

### "Vosk model not found"

**Check model path:**
```bash
# Find your model
find ~ -name "vosk-model*" -type d

# Check if it exists
ls -la /home/pi/vosk-model-small-en-us-0.15/

# Should contain these folders:
# am/ conf/ graph/ ivector/
```

**Update config:**
```bash
nano iot-meeting-minutes/configs/recorder_config.yml
# Update model_path line
```

### "No microphone detected"

```bash
# List devices
arecord -l

# Check USB
lsusb

# Add to audio group
sudo usermod -a -G audio $USER
sudo reboot
```

### "Port 5000 already in use"

```bash
# Find process
lsof -i :5000

# Kill it
pkill -f gunicorn

# Or kill specific PID
kill -9 <PID>
```

### "Cannot connect from laptop"

```bash
# On Pi - check if running
ps aux | grep gunicorn

# Check firewall
sudo ufw status
sudo ufw allow 5000/tcp

# Get correct IP
hostname -I

# Test from Pi
curl http://localhost:5000/api/health
```

---

## 🎯 Quick Commands

```bash
# Start backend
./start_backend.sh

# Stop backend
pkill -f gunicorn

# Check if running
ps aux | grep gunicorn

# Get IP address
hostname -I

# Test microphone
arecord -d 5 test.wav && aplay test.wav

# View logs
tail -f /tmp/backend.log

# Edit config
nano iot-meeting-minutes/configs/recorder_config.yml

# Restart backend
pkill -f gunicorn && ./start_backend.sh
```

---

## 📊 What Runs Where

```
┌─────────────────────────────────────────────────────────┐
│                    Your WiFi Network                     │
│                                                           │
│  ┌──────────────────┐              ┌──────────────────┐ │
│  │   Your Laptop    │              │  Raspberry Pi    │ │
│  │                  │              │                  │ │
│  │  ✅ Frontend     │──── HTTP ───▶│  ✅ Backend      │ │
│  │  ✅ React App    │   Request    │  ✅ Flask API    │ │
│  │  ✅ Browser UI   │              │  ✅ Vosk STT     │ │
│  │  ✅ npm serve    │◀──── JSON ───│  ✅ OpenRouter   │ │
│  │                  │   Response   │  ✅ Microphone   │ │
│  │  Port: 3000      │              │  ✅ Database     │ │
│  │                  │              │                  │ │
│  │                  │              │  Port: 5000      │ │
│  └──────────────────┘              └──────────────────┘ │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🎉 You're Ready!

**On Raspberry Pi:**
1. ✅ Backend installed
2. ✅ Vosk model path configured
3. ✅ Backend running on port 5000

**On Laptop:**
1. ✅ Frontend configured with Pi IP
2. ✅ Frontend running on port 3000
3. ✅ Can access at http://localhost:3000

**Start recording meetings!** 🎤📝

---

## 📞 Need Help?

**Backend won't start:**
- Check: `tail -f /tmp/backend.log`
- Verify: Vosk model path in config

**Frontend can't connect:**
- Check: Pi IP address with `hostname -I`
- Update: `frontend/.env.production`
- Rebuild: `npm run build`

**No microphone:**
- Check: `arecord -l`
- Test: `arecord -d 5 test.wav`

**For detailed help:**
- See: `RASPBERRY_PI_COMPLETE_GUIDE.md`
- See: `QUICK_REFERENCE.md`
