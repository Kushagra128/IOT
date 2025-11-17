# Deployment Checklist: Laptop + Raspberry Pi Setup

Use this checklist to ensure your Meeting Transcriber system is properly configured for network operation.

## Pre-Deployment

### Hardware Requirements
- [ ] Raspberry Pi (3B+ or newer recommended)
- [ ] Microphone connected to Raspberry Pi
- [ ] Laptop for running frontend
- [ ] Both devices connected to same WiFi network

### Software Requirements
- [ ] Python 3.7+ installed on Raspberry Pi
- [ ] Node.js 16+ installed on laptop
- [ ] Vosk model downloaded on Raspberry Pi

---

## Raspberry Pi Backend Setup

### 1. Install Dependencies
```bash
cd backend
pip3 install -r requirements.txt
```

- [ ] All Python packages installed successfully
- [ ] No dependency errors

### 2. Download Vosk Model
```bash
# Download and extract Vosk model
wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
unzip vosk-model-small-en-us-0.15.zip
```

- [ ] Vosk model downloaded
- [ ] Model extracted to correct location
- [ ] Model path configured in code

### 3. Test Microphone
```bash
python3 backend/test_mic.py
```

- [ ] Microphone detected
- [ ] Audio recording works
- [ ] No permission errors

### 4. Configure Backend
Check `backend/app.py`:
```python
app.run(debug=False, host="0.0.0.0", port=5000, threaded=True)
```

- [ ] `host="0.0.0.0"` (allows network access)
- [ ] `port=5000` (or your chosen port)
- [ ] CORS enabled for cross-origin requests

### 5. Start Backend
```bash
cd backend
python3 app.py
```

- [ ] Backend starts without errors
- [ ] Listening on `0.0.0.0:5000`
- [ ] No port conflicts

### 6. Get Raspberry Pi IP Address
```bash
hostname -I
```

- [ ] IP address noted (e.g., `192.168.1.100`)
- [ ] IP is on same subnet as laptop

### 7. Test Backend Locally (on Pi)
```bash
curl http://localhost:5000/api/health
```

- [ ] Returns successful response
- [ ] No errors in backend logs

---

## Laptop Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

- [ ] All npm packages installed
- [ ] No dependency conflicts

### 2. Configure API URL

**Option A: Use configuration script**
```bash
# Linux/Mac
./configure_frontend.sh

# Windows
configure_frontend.bat
```

**Option B: Manual configuration**

Edit `frontend/.env.production`:
```env
VITE_API_URL=http://192.168.1.100:5000
```

- [ ] `.env.production` file created
- [ ] Raspberry Pi IP address correct
- [ ] Port number correct (default: 5000)

### 3. Build Frontend
```bash
npm run build
```

- [ ] Build completes successfully
- [ ] `dist/` folder created
- [ ] No build errors

### 4. Serve Frontend
```bash
npm run serve
# or
npx serve -s dist -p 3000
```

- [ ] Frontend server starts
- [ ] Accessible at `http://localhost:3000`
- [ ] No port conflicts

---

## Network Testing

### 1. Test Backend from Laptop
```bash
# From your laptop
curl http://192.168.1.100:5000/api/health
```

- [ ] Successful response received
- [ ] No connection timeout
- [ ] No firewall blocking

### 2. Test Frontend Connection

Open browser on laptop: `http://localhost:3000`

- [ ] Frontend loads successfully
- [ ] No console errors
- [ ] See log: "API configured to connect to: http://192.168.1.100:5000"

### 3. Test User Registration
- [ ] Can register new user
- [ ] Receives JWT token
- [ ] No CORS errors

### 4. Test User Login
- [ ] Can login with credentials
- [ ] Dashboard loads
- [ ] User data fetched from backend

---

## Recording Pipeline Testing

### 1. Start Recording
Click "Start Recording" button

- [ ] Request sent to Raspberry Pi
- [ ] Backend starts recording
- [ ] No errors in browser console
- [ ] No errors in backend logs

### 2. Live Transcription
Speak into microphone (connected to Raspberry Pi)

- [ ] Transcript appears on laptop screen
- [ ] Updates in real-time (every 2 seconds)
- [ ] Text is accurate
- [ ] No lag or delays

### 3. Stop Recording
Click "Stop Recording" button

- [ ] Recording stops successfully
- [ ] Backend processes final transcript
- [ ] Summary generated
- [ ] Redirected to recording detail page

### 4. View Recording
- [ ] Transcript displayed correctly
- [ ] Summary displayed correctly
- [ ] Duration calculated correctly
- [ ] PDF download works

---

## Troubleshooting Checklist

### Connection Issues

If frontend can't connect to backend:

- [ ] Both devices on same WiFi network
- [ ] Raspberry Pi IP address correct in `.env.production`
- [ ] Backend is running on Raspberry Pi
- [ ] Firewall not blocking port 5000
- [ ] CORS configured correctly

Test commands:
```bash
# On Raspberry Pi
hostname -I
sudo ufw status
sudo ufw allow 5000/tcp

# On laptop
ping 192.168.1.100
curl http://192.168.1.100:5000/api/health
```

### Microphone Issues

If recording doesn't capture audio:

- [ ] Microphone connected to Raspberry Pi (not laptop)
- [ ] Microphone permissions granted
- [ ] Correct audio device selected
- [ ] Audio levels not muted

Test commands:
```bash
# On Raspberry Pi
arecord -l
python3 backend/test_mic.py
```

### Transcription Issues

If transcript is empty or inaccurate:

- [ ] Vosk model loaded correctly
- [ ] Speaking clearly and loudly enough
- [ ] Microphone positioned correctly
- [ ] No background noise interference
- [ ] Correct language model for your accent

### CORS Errors

If seeing CORS errors in browser console:

Check `backend/app.py`:
```python
from flask_cors import CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})
```

- [ ] flask-cors installed
- [ ] CORS enabled in app
- [ ] Origins configured correctly

---

## Performance Optimization

### Raspberry Pi
- [ ] Close unnecessary applications
- [ ] Ensure adequate cooling
- [ ] Use quality power supply (5V 3A recommended)
- [ ] Consider overclocking for better performance

### Network
- [ ] Use 5GHz WiFi if available
- [ ] Minimize distance between devices and router
- [ ] Reduce network congestion
- [ ] Consider wired Ethernet for Raspberry Pi

### Frontend
- [ ] Use production build (not dev mode)
- [ ] Enable browser caching
- [ ] Close unnecessary browser tabs

---

## Security Checklist (Production)

- [ ] Change default passwords
- [ ] Use HTTPS (configure reverse proxy)
- [ ] Restrict CORS to specific origins
- [ ] Enable firewall rules
- [ ] Keep software updated
- [ ] Use strong JWT secret
- [ ] Implement rate limiting
- [ ] Regular security audits

---

## Maintenance

### Daily
- [ ] Check backend logs for errors
- [ ] Monitor disk space on Raspberry Pi
- [ ] Verify recordings are being saved

### Weekly
- [ ] Backup database
- [ ] Clean up old recordings (if needed)
- [ ] Check for software updates

### Monthly
- [ ] Review system performance
- [ ] Update dependencies
- [ ] Test disaster recovery

---

## Success Criteria

Your system is fully operational when:

✅ Frontend on laptop connects to Raspberry Pi backend
✅ User can register and login
✅ Recording starts when button clicked
✅ Live transcript appears in real-time
✅ Audio is captured from Raspberry Pi microphone
✅ Vosk transcribes speech accurately
✅ Summary is generated after recording stops
✅ PDFs can be downloaded
✅ All recordings saved to database

---

## Quick Reference

### Start Backend (Raspberry Pi)
```bash
cd backend && python3 app.py
```

### Start Frontend (Laptop)
```bash
cd frontend && npm run serve
```

### Find Raspberry Pi IP
```bash
hostname -I
```

### Test Connection
```bash
curl http://<raspberry-pi-ip>:5000/api/health
```

### View Logs
```bash
# Backend logs
tail -f backend/app.log

# Frontend (browser console)
F12 → Console tab
```

---

## Support

If you encounter issues not covered in this checklist:

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Review [NETWORK_SETUP.md](NETWORK_SETUP.md)
3. Check backend logs on Raspberry Pi
4. Check browser console on laptop
5. Verify all checklist items completed

## Next Steps

Once everything is working:

1. Configure static IP for Raspberry Pi (see NETWORK_SETUP.md)
2. Set up automatic backend startup on boot
3. Create desktop shortcuts for easy access
4. Document your specific network configuration
5. Train users on the system
