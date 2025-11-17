# 🎯 START HERE - Complete Setup in 3 Steps

## What You're Building

A **Meeting Transcriber** that runs on your Raspberry Pi (backend + microphone) and your laptop (frontend interface).

---

## 📦 Step 1: Transfer to Raspberry Pi

**Choose one method:**

### Method A: USB Drive (Easiest)
1. Copy entire `meeting-transcriber` folder to USB drive
2. Insert USB into Raspberry Pi
3. Open terminal on Pi:
```bash
cp -r /media/pi/*/meeting-transcriber ~/
cd ~/meeting-transcriber
```

### Method B: SCP from Laptop
```bash
# On your laptop
scp -r meeting-transcriber pi@<raspberry-pi-ip>:~/
```

### Method C: Git
```bash
# On Raspberry Pi
cd ~
git clone <your-repo-url> meeting-transcriber
cd meeting-transcriber
```

---

## ⚙️ Step 2: Install on Raspberry Pi

**Run ONE command:**

```bash
cd ~/meeting-transcriber
chmod +x install_rpi.sh
./install_rpi.sh
```

**What this does:**
- ✅ Installs Python, Node.js, dependencies
- ✅ Downloads Vosk speech recognition model (50MB)
- ✅ Sets up backend virtual environment
- ✅ Builds frontend
- ✅ Creates startup scripts
- ⏱️ Takes 15-20 minutes

**Just wait for it to finish!**

---

## 🚀 Step 3: Start Everything

### On Raspberry Pi:

```bash
cd ~/meeting-transcriber
./start_backend.sh
```

**You should see:**
```
🚀 PRELOADING VOSK MODEL INTO RAM...
✓ Vosk model successfully preloaded into RAM!
Starting backend server on http://0.0.0.0:5000
```

**Keep this terminal open!**

### On Your Laptop:

1. **Find Raspberry Pi IP:**
   - On Pi terminal, run: `hostname -I`
   - Note the IP (e.g., `192.168.1.100`)

2. **Configure frontend:**
```bash
cd frontend

# Windows:
configure_frontend.bat

# Mac/Linux:
./configure_frontend.sh
```
   - Enter your Pi's IP when asked

3. **Start frontend:**
```bash
npm install
npm run build
npm run serve
```

4. **Open browser:**
   - Go to: `http://localhost:3000`
   - Register an account
   - Click "Start Recording"
   - Speak into the microphone (connected to Pi)
   - Watch live transcript appear!

---

## ✅ Quick Test

1. **On Pi:** Backend running? Check for "Vosk model loaded" message
2. **On Laptop:** Open `http://localhost:3000`
3. **Register/Login**
4. **Go to Settings** (gear icon) → Test connection to Pi
5. **Start Recording** → Speak → See transcript → Stop
6. **View Results** → See transcript and AI summary

---

## 🎤 Important Notes

- **Microphone must be connected to Raspberry Pi** (not laptop)
- **Both devices must be on same WiFi network**
- **Backend must stay running on Pi** (don't close terminal)
- **First recording starts instantly** (Vosk model preloaded in RAM)

---

## 📁 Key Files

### On Raspberry Pi:
- `~/meeting-transcriber/start_backend.sh` - Start backend
- `~/meeting-transcriber/iot-meeting-minutes/configs/recorder_config.yml` - Configuration
- `~/meeting-transcriber/iot-meeting-minutes/recordings/` - Saved recordings

### On Laptop:
- `frontend/.env.production` - Backend IP configuration
- `frontend/configure_frontend.sh` - Configuration helper

---

## 🔧 Configuration

### Change Summarizer (on Pi):

```bash
nano ~/meeting-transcriber/iot-meeting-minutes/configs/recorder_config.yml
```

Options:
- `ollama` - AI summary using OpenRouter (default, best quality)
- `textrank` - Fast extractive summary (offline, lighter)
- `t5_small` - Local AI summary (requires more RAM)

### Change Backend IP (on Laptop):

```bash
cd frontend
nano .env.production
# Change: VITE_API_URL=http://192.168.1.100:5000
```

---

## 🐛 Troubleshooting

### "Cannot connect to backend"
```bash
# On Pi - check if running
ps aux | grep gunicorn

# Restart backend
cd ~/meeting-transcriber
./start_backend.sh
```

### "No microphone detected"
```bash
# On Pi - list devices
arecord -l

# Test recording
arecord -d 5 -f cd test.wav
aplay test.wav
```

### "Frontend can't reach Pi"
```bash
# On Pi - get IP
hostname -I

# On laptop - test connection
curl http://192.168.1.100:5000/api/health

# Update frontend config
cd frontend
nano .env.production
```

---

## 📚 Full Documentation

- **Complete Guide:** `RASPBERRY_PI_COMPLETE_GUIDE.md`
- **Network Setup:** `NETWORK_SETUP.md`
- **Deployment Checklist:** `DEPLOYMENT_CHECKLIST.md`
- **Quick Start:** `QUICK_START_NETWORK.md`

---

## 🎉 You're Done!

Your system is ready:
- ✅ Backend on Raspberry Pi with Vosk STT
- ✅ Frontend on laptop with beautiful UI
- ✅ Real-time transcription
- ✅ AI-powered summaries
- ✅ User authentication
- ✅ PDF exports

**Start recording your meetings now!** 🚀

---

## 🆘 Quick Help

**Backend not starting?**
```bash
cd ~/meeting-transcriber/backend
source venv/bin/activate
python3 app.py
# Check error messages
```

**Frontend not connecting?**
1. Check Pi IP: `hostname -I`
2. Update `frontend/.env.production`
3. Rebuild: `npm run build`
4. Restart: `npm run serve`

**No transcript appearing?**
1. Check microphone: `arecord -l`
2. Test recording: `arecord -d 5 test.wav`
3. Check backend logs for "[STT]" messages
4. Increase mic volume: `alsamixer` (F4 for capture)

---

## 📞 System Status Check

Run these to verify everything:

```bash
# On Raspberry Pi:
hostname -I                    # Get IP
ps aux | grep gunicorn        # Backend running?
arecord -l                    # Microphone detected?
ls ~/meeting-transcriber/vosk-model-small-en-us-0.15/  # Model exists?

# On Laptop:
curl http://192.168.1.100:5000/api/health  # Backend reachable?
cat frontend/.env.production   # IP configured?
```

All good? **You're ready to record!** 🎤
