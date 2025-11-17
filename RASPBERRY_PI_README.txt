================================================================================
                    🎯 RASPBERRY PI BACKEND SETUP
================================================================================

WHAT TO TRANSFER TO RASPBERRY PI:
----------------------------------
✅ backend/ folder
✅ iot-meeting-minutes/ folder
✅ install_backend_only.sh
✅ This README and guides

❌ DON'T transfer frontend/ folder (stays on laptop)

================================================================================

INSTALLATION (3 SIMPLE STEPS):
-------------------------------

STEP 1: Install Backend
------------------------
cd ~/meeting-transcriber
chmod +x install_backend_only.sh
./install_backend_only.sh

⏱️ Takes 10-15 minutes

STEP 2: Update Vosk Model Path
-------------------------------
nano iot-meeting-minutes/configs/recorder_config.yml

Find this line:
    model_path: /home/pi/vosk-model-small-en-us-0.15

Change to YOUR model location:
    model_path: /home/pi/YOUR_VOSK_MODEL_PATH

Save: Ctrl+X, Y, Enter

📖 See UPDATE_VOSK_PATH.txt for detailed instructions

STEP 3: Start Backend
----------------------
./start_backend.sh

✅ Backend is now running!
✅ Note your IP address (shown in output)

================================================================================

WHAT GETS INSTALLED:
--------------------
✅ Python 3 and pip
✅ Audio libraries (PortAudio, ALSA)
✅ Flask and backend dependencies
✅ Vosk speech recognition
✅ OpenRouter AI integration
✅ Database support
✅ PDF generation

❌ NOT installed (not needed on Pi):
❌ Node.js
❌ Frontend dependencies
❌ Vosk model (you already have it)

================================================================================

AFTER INSTALLATION:
-------------------

Your Raspberry Pi will:
✅ Run backend server on port 5000
✅ Listen for connections from your laptop
✅ Record audio from USB microphone
✅ Process speech with Vosk
✅ Generate AI summaries
✅ Save to database

Your Laptop will:
✅ Run frontend on port 3000
✅ Connect to Pi backend
✅ Display live transcription
✅ Show summaries and recordings

================================================================================

QUICK COMMANDS:
---------------

Start backend:
    ./start_backend.sh

Stop backend:
    pkill -f gunicorn

Get IP address:
    hostname -I

Test microphone:
    arecord -l
    arecord -d 5 test.wav && aplay test.wav

Check if running:
    ps aux | grep gunicorn

View logs:
    tail -f /tmp/backend.log

Edit config:
    nano iot-meeting-minutes/configs/recorder_config.yml

================================================================================

CONFIGURATION FILE:
-------------------

Location: iot-meeting-minutes/configs/recorder_config.yml

Important settings:

model_path: /home/pi/vosk-model-small-en-us-0.15  # ⭐ UPDATE THIS
sample_rate: 16000
channels: 1
summarizer: ollama  # Options: ollama, textrank, t5_small

================================================================================

LAPTOP FRONTEND SETUP:
----------------------

On your laptop (NOT on Raspberry Pi):

1. Get Pi IP address (from Pi terminal):
   hostname -I

2. Configure frontend:
   cd frontend
   ./configure_frontend.sh    (or .bat on Windows)

3. Enter Pi IP when prompted

4. Build and start:
   npm install
   npm run build
   npm run serve

5. Open browser:
   http://localhost:3000

================================================================================

VERIFICATION:
-------------

✅ Backend running:
   curl http://localhost:5000/api/health

✅ Microphone detected:
   arecord -l

✅ Vosk model found:
   ls -la /home/pi/vosk-model-small-en-us-0.15/

✅ Can connect from laptop:
   curl http://192.168.1.100:5000/api/health
   (replace with your Pi IP)

================================================================================

TROUBLESHOOTING:
----------------

Problem: "Vosk model not found"
Solution: Update model_path in recorder_config.yml
          See: UPDATE_VOSK_PATH.txt

Problem: "No microphone detected"
Solution: Check USB connection
          Run: arecord -l
          Add to audio group: sudo usermod -a -G audio $USER

Problem: "Port 5000 in use"
Solution: pkill -f gunicorn
          Then: ./start_backend.sh

Problem: "Cannot connect from laptop"
Solution: Check Pi IP: hostname -I
          Check firewall: sudo ufw allow 5000/tcp
          Test: curl http://localhost:5000/api/health

================================================================================

FILES ON RASPBERRY PI:
----------------------

~/meeting-transcriber/
├── backend/
│   ├── app.py                  # Main Flask server
│   ├── recording_service.py    # Recording management
│   ├── database.py             # Database models
│   ├── requirements_rpi.txt    # Python dependencies
│   └── venv/                   # Virtual environment
│
├── iot-meeting-minutes/
│   ├── recorder.py             # Audio recording
│   ├── stt_engine.py           # Vosk integration
│   ├── summarizer.py           # AI summarization
│   └── configs/
│       └── recorder_config.yml # ⭐ Configuration file
│
├── install_backend_only.sh     # Installation script
├── start_backend.sh            # Startup script
└── meeting_transcriber.db      # Database (created on first run)

================================================================================

DOCUMENTATION:
--------------

📖 RASPBERRY_PI_BACKEND_ONLY.md  - Complete backend setup guide
📖 UPDATE_VOSK_PATH.txt           - How to update Vosk model path
📖 RASPBERRY_PI_COMPLETE_GUIDE.md - Detailed troubleshooting
📖 QUICK_REFERENCE.md             - Command reference

================================================================================

SYSTEM ARCHITECTURE:
--------------------

┌─────────────────────────────────────────────────────────┐
│                    Your WiFi Network                     │
│                                                           │
│  ┌──────────────────┐              ┌──────────────────┐ │
│  │   Your Laptop    │              │  Raspberry Pi    │ │
│  │                  │              │                  │ │
│  │  Frontend        │──── HTTP ───▶│  Backend         │ │
│  │  Port: 3000      │              │  Port: 5000      │ │
│  │                  │              │                  │ │
│  │  • Browser UI    │◀──── JSON ───│  • Flask API     │ │
│  │  • React App     │              │  • Vosk STT      │ │
│  │  • Dashboard     │              │  • OpenRouter AI │ │
│  │                  │              │  • 🎤 Microphone │ │
│  │                  │              │  • Database      │ │
│  └──────────────────┘              └──────────────────┘ │
│                                                           │
└─────────────────────────────────────────────────────────┘

================================================================================

RECORDING FLOW:
---------------

1. User clicks "Start Recording" on laptop
2. Frontend sends request to Pi: http://192.168.1.100:5000/api/recordings/start
3. Pi backend starts recording from USB microphone
4. Vosk processes audio in real-time
5. Frontend polls for transcript updates every 2 seconds
6. Live transcript appears on laptop screen
7. User clicks "Stop Recording"
8. Backend generates AI summary
9. Frontend displays complete transcript + summary

================================================================================

AUTO-START ON BOOT (OPTIONAL):
-------------------------------

To start backend automatically when Pi boots:

sudo nano /etc/systemd/system/meeting-backend.service

Paste:
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

Enable:
sudo systemctl enable meeting-backend
sudo systemctl start meeting-backend

================================================================================

PERFORMANCE TIPS:
-----------------

✅ Use wired Ethernet instead of WiFi
✅ Close unnecessary applications
✅ Use active cooling for Pi
✅ Monitor temperature: vcgencmd measure_temp
✅ For lighter load, use textrank summarizer

================================================================================

BACKUP:
-------

Backup database:
    cp meeting_transcriber.db meeting_transcriber.db.backup

Backup recordings:
    tar -czf recordings_backup.tar.gz iot-meeting-minutes/recordings/

Backup configuration:
    cp iot-meeting-minutes/configs/recorder_config.yml config.backup

================================================================================

YOU'RE READY! 🎉
----------------

1. ✅ Install: ./install_backend_only.sh
2. ✅ Update Vosk path in config
3. ✅ Start: ./start_backend.sh
4. ✅ Configure laptop frontend
5. ✅ Start recording!

For detailed instructions, see: RASPBERRY_PI_BACKEND_ONLY.md

================================================================================
