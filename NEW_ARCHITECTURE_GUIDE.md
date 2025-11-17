# 🎯 New Architecture: Laptop Records, Pi Processes

## ✅ What Changed

**OLD:** Raspberry Pi records audio from USB microphone  
**NEW:** Laptop records audio from browser, uploads to Pi for processing

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Your WiFi Network                         │
│                                                               │
│  ┌──────────────────┐              ┌──────────────────────┐ │
│  │   Your Laptop    │              │  Raspberry Pi        │ │
│  │                  │              │                      │ │
│  │  1. Record audio │              │  4. Receive audio    │ │
│  │     from browser │              │     file             │ │
│  │     microphone   │              │                      │ │
│  │                  │              │  5. Convert to WAV   │ │
│  │  2. Capture in   │──Upload─────▶│                      │ │
│  │     WebM format  │   Audio      │  6. Process with     │ │
│  │                  │   File       │     Vosk STT         │ │
│  │  3. Upload when  │              │                      │ │
│  │     stopped      │              │  7. Generate AI      │ │
│  │                  │              │     summary          │ │
│  │  8. Display      │◀──Results────│                      │ │
│  │     transcript   │   JSON       │  9. Save to DB       │ │
│  │     & summary    │              │                      │ │
│  │                  │              │  10. Return results  │ │
│  └──────────────────┘              └──────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Recording Flow

### 1. User Clicks "Start Recording" (Laptop)

**Frontend:**
- Requests microphone permission from browser
- Creates MediaRecorder with audio settings:
  - Format: WebM (Opus codec)
  - Sample rate: 16kHz
  - Channels: Mono
  - Noise suppression: Enabled
- Starts capturing audio locally

**Backend (Pi):**
- Creates session in database
- Prepares folder for files
- Initializes Vosk engine (preloaded in RAM)
- Waits for audio upload

### 2. Recording in Progress

**Frontend:**
- Captures audio chunks every 1 second
- Stores in memory
- Shows live timer
- Polls backend for transcript updates (every 2 seconds)

**Backend (Pi):**
- Session marked as "recording"
- Waiting for audio file

### 3. User Clicks "Stop Recording" (Laptop)

**Frontend:**
- Stops MediaRecorder
- Combines all audio chunks into single Blob
- Uploads audio file to Pi via POST `/api/recordings/{id}/upload`
- Waits for upload to complete
- Calls POST `/api/recordings/{id}/stop` to trigger processing

**Backend (Pi):**
- Receives audio file (WebM format)
- Saves to disk
- Converts WebM → WAV using ffmpeg
- Processes WAV with Vosk STT
- Generates transcript
- Creates AI summary
- Saves everything to database
- Returns results to frontend

### 4. Results Displayed

**Frontend:**
- Receives transcript and summary
- Displays on screen
- Allows PDF download
- Shows in dashboard

---

## 📁 File Flow

### On Laptop:
```
Browser Microphone
    ↓
MediaRecorder (WebM)
    ↓
Audio Chunks in Memory
    ↓
Combined Blob
    ↓
Upload to Pi
```

### On Raspberry Pi:
```
Receive Upload
    ↓
Save as .webm file
    ↓
Convert to .wav (ffmpeg)
    ↓
Process with Vosk
    ↓
Generate Transcript
    ↓
Create AI Summary
    ↓
Save to Database
    ↓
Generate PDFs
    ↓
Return Results
```

---

## 🔧 Technical Details

### Frontend Changes

**File: `frontend/src/pages/Recording.jsx`**

**New Features:**
- Uses browser `MediaRecorder` API
- Captures audio locally
- Uploads audio file when stopped
- No longer relies on Pi microphone

**Audio Settings:**
```javascript
{
  audio: {
    channelCount: 1,        // Mono
    sampleRate: 16000,      // 16kHz (Vosk requirement)
    echoCancellation: true, // Better quality
    noiseSuppression: true  // Reduce background noise
  }
}
```

### Backend Changes

**File: `backend/app.py`**

**New Endpoint:**
```python
POST /api/recordings/{session_id}/upload
```
- Receives audio file from laptop
- Saves and queues for processing
- Returns immediately

**File: `backend/recording_service.py`**

**New Methods:**
- `process_uploaded_audio()` - Handles uploaded files
- `_convert_to_wav()` - Converts WebM to WAV
- `_process_uploaded_wav()` - Runs Vosk on WAV file

**Changes:**
- No longer starts AudioRecorder on Pi
- Waits for audio upload instead
- Processes uploaded file asynchronously

---

## 🎤 Audio Format Details

### Captured on Laptop:
- **Format:** WebM
- **Codec:** Opus
- **Sample Rate:** 16kHz
- **Channels:** Mono (1)
- **Bitrate:** Variable (browser decides)

### Converted on Pi:
- **Format:** WAV
- **Sample Rate:** 16kHz (Vosk requirement)
- **Channels:** Mono (1)
- **Bit Depth:** 16-bit PCM

---

## 🚀 Setup Instructions

### 1. Install FFmpeg on Raspberry Pi

```bash
sudo apt install ffmpeg
```

### 2. Update Backend Dependencies

```bash
cd backend
source venv/bin/activate
pip install pydub
```

### 3. Restart Backend

```bash
./start_backend.sh
```

### 4. Start Frontend on Laptop

```bash
cd frontend
npm install
npm run dev
```

### 5. Test Recording

1. Open `http://localhost:5173`
2. Login/Register
3. Click "Start Recording"
4. **Allow microphone access** when browser asks
5. Speak into your **laptop microphone**
6. Click "Stop Recording"
7. Wait for upload and processing
8. View transcript and summary!

---

## ✅ Advantages

1. **No USB Microphone Needed on Pi**
   - Use any laptop microphone
   - Better audio quality
   - More convenient

2. **Better Audio Quality**
   - Browser handles noise cancellation
   - Echo cancellation built-in
   - Professional audio processing

3. **More Flexible**
   - Record from any device
   - Multiple users can record simultaneously
   - No hardware dependencies on Pi

4. **Easier Setup**
   - No microphone configuration on Pi
   - No audio driver issues
   - Works with any laptop

---

## 🐛 Troubleshooting

### "Microphone permission denied"

**Solution:**
- Click "Allow" when browser asks
- Check browser settings → Privacy → Microphone
- Make sure site has microphone permission

### "Upload failed"

**Solution:**
- Check network connection
- Verify backend is running: `curl http://10.124.101.100:5000/api/health`
- Check file size (should be < 500MB)
- Check backend logs: `tail -f /tmp/backend.log`

### "No transcript generated"

**Solution:**
- Speak clearly and loudly
- Check audio was recorded (should see timer counting)
- Verify ffmpeg installed: `ffmpeg -version`
- Check Vosk model path in config

### "Conversion failed"

**Solution:**
- Install ffmpeg: `sudo apt install ffmpeg`
- Install pydub: `pip install pydub`
- Check backend logs for errors

---

## 📊 Performance

### Upload Time:
- 1 minute recording ≈ 1-2 MB
- Upload time ≈ 2-5 seconds (on good WiFi)

### Processing Time:
- Conversion (WebM → WAV): 1-2 seconds
- Vosk transcription: Real-time (1 min audio = 1 min processing)
- AI summary: 5-10 seconds
- **Total:** ~1-2 minutes for 1 minute recording

---

## 🎉 You're Ready!

**New workflow:**
1. ✅ Laptop records audio from browser
2. ✅ Uploads to Raspberry Pi
3. ✅ Pi processes with Vosk
4. ✅ Pi generates AI summary
5. ✅ Results sent back to laptop
6. ✅ Display transcript and summary

**No USB microphone needed on Pi!** 🎤💻
