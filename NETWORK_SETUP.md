# Network Setup Guide: Frontend (Laptop) ↔ Backend (Raspberry Pi)

This guide explains how to set up your Meeting Transcriber system where:
- **Backend** runs on Raspberry Pi (with Vosk, OpenRouter, and REST API)
- **Frontend** runs on your laptop
- Both devices communicate over the same WiFi network

## Prerequisites

- Raspberry Pi and laptop connected to the same WiFi network
- Backend installed and configured on Raspberry Pi
- Frontend built and ready to run on laptop

---

## Step 1: Find Your Raspberry Pi's IP Address

On your Raspberry Pi, run:

```bash
hostname -I
```

This will output something like: `192.168.1.100 fe80::...`

The first IP address (e.g., `192.168.1.100`) is your Raspberry Pi's local network IP.

**Note this IP address** - you'll need it for the frontend configuration.

---

## Step 2: Configure Backend to Accept Network Connections

### Update Backend Configuration

Edit `backend/app_rpi.py` to ensure it listens on all network interfaces:

```python
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
```

The `host='0.0.0.0'` setting allows the backend to accept connections from any device on the network, not just localhost.

### Start the Backend on Raspberry Pi

```bash
cd backend
python3 app_rpi.py
```

The backend should now be running and accessible at `http://<raspberry-pi-ip>:5000`

---

## Step 3: Configure Frontend to Connect to Raspberry Pi

### Update the Production Environment File

On your laptop, edit `frontend/.env.production`:

```env
# Replace with your Raspberry Pi's actual IP address from Step 1
VITE_API_URL=http://192.168.1.100:5000
```

**Important:** Replace `192.168.1.100` with the actual IP address you found in Step 1.

---

## Step 4: Build and Run Frontend on Laptop

### Option A: Production Build (Recommended)

Build the frontend for production:

```bash
cd frontend
npm run build
```

Serve the production build:

```bash
npm install -g serve
serve -s dist -p 3000
```

The frontend will be available at `http://localhost:3000` on your laptop.

### Option B: Development Mode

For development/testing, you can run:

```bash
cd frontend
npm run dev -- --host
```

This makes the dev server accessible from other devices on your network.

---

## Step 5: Test the Connection

### From Your Laptop

1. Open your browser and go to `http://localhost:3000` (or the port you configured)
2. Register/login to the application
3. Click "Start Recording"
4. The frontend will send a request to the Raspberry Pi backend
5. The Raspberry Pi will start recording audio and processing it with Vosk

### Verify Backend Connection

Open browser console (F12) and check for the log message:
```
API configured to connect to: http://192.168.1.100:5000
```

If you see this, the frontend is correctly configured to talk to your Raspberry Pi.

---

## Troubleshooting

### Cannot Connect to Backend

**Problem:** Frontend shows "Failed to start recording" or connection errors.

**Solutions:**

1. **Verify Raspberry Pi IP hasn't changed:**
   ```bash
   hostname -I
   ```
   Update `.env.production` if the IP changed.

2. **Check if backend is running on Raspberry Pi:**
   ```bash
   curl http://localhost:5000/api/health
   ```

3. **Test connection from laptop to Raspberry Pi:**
   ```bash
   curl http://192.168.1.100:5000/api/health
   ```
   (Replace with your Pi's IP)

4. **Check firewall on Raspberry Pi:**
   ```bash
   sudo ufw status
   sudo ufw allow 5000/tcp
   ```

### CORS Errors

If you see CORS errors in the browser console, ensure the backend has CORS enabled for your laptop's IP.

In `backend/app_rpi.py`, verify:
```python
from flask_cors import CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})
```

### Microphone Not Working

The microphone must be connected to the **Raspberry Pi**, not your laptop. The frontend only sends commands; all audio recording happens on the Pi.

Verify microphone on Raspberry Pi:
```bash
arecord -l
python3 backend/test_mic.py
```

---

## Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Local WiFi Network                       │
│                                                               │
│  ┌──────────────────┐                  ┌──────────────────┐ │
│  │     Laptop       │                  │  Raspberry Pi    │ │
│  │                  │                  │                  │ │
│  │  Frontend (React)│ ─── HTTP ───────▶│  Backend (Flask) │ │
│  │  Port: 3000      │   Requests       │  Port: 5000      │ │
│  │                  │                  │                  │ │
│  │                  │                  │  • Vosk STT      │ │
│  │                  │                  │  • OpenRouter    │ │
│  │                  │                  │  • Microphone    │ │
│  └──────────────────┘                  └──────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

1. User clicks "Start Recording" on laptop frontend
2. Frontend sends POST request to `http://192.168.1.100:5000/api/recordings/start`
3. Raspberry Pi backend receives request and starts:
   - Audio recording from connected microphone
   - Vosk speech-to-text processing
   - Real-time transcript generation
4. Frontend polls `http://192.168.1.100:5000/api/recordings/{id}/transcript` for live updates
5. User clicks "Stop Recording"
6. Backend finalizes recording, generates summary via OpenRouter, and saves to database
7. Frontend displays the complete transcript and summary

---

## Static IP Configuration (Optional but Recommended)

To prevent your Raspberry Pi's IP from changing, configure a static IP:

### On Raspberry Pi

Edit `/etc/dhcpcd.conf`:

```bash
sudo nano /etc/dhcpcd.conf
```

Add at the end:

```
interface wlan0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=192.168.1.1 8.8.8.8
```

Adjust the IP addresses to match your network configuration.

Reboot:
```bash
sudo reboot
```

---

## Security Considerations

### For Production Use

1. **Enable HTTPS:** Use a reverse proxy (nginx) with SSL certificates
2. **Restrict CORS:** Limit allowed origins to your laptop's IP
3. **Add authentication:** Ensure JWT tokens are properly validated
4. **Firewall rules:** Only allow necessary ports (5000 for API)

### Example: Restrict CORS to Laptop IP

In `backend/app_rpi.py`:

```python
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://192.168.1.50:3000"]  # Your laptop's IP
    }
})
```

---

## Quick Reference Commands

### On Raspberry Pi (Backend)

```bash
# Find IP address
hostname -I

# Start backend
cd backend
python3 app_rpi.py

# Check if backend is running
curl http://localhost:5000/api/health

# View backend logs
tail -f backend.log
```

### On Laptop (Frontend)

```bash
# Update Raspberry Pi IP in config
nano frontend/.env.production

# Build frontend
cd frontend
npm run build

# Serve production build
serve -s dist -p 3000

# Or run in dev mode
npm run dev -- --host
```

---

## Summary

Your setup is now complete! The frontend on your laptop communicates with the Raspberry Pi backend over WiFi. When you start a recording from the laptop, the Raspberry Pi handles all the heavy lifting: audio capture, speech-to-text with Vosk, and summarization with OpenRouter.
