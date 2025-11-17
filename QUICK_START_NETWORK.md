# Quick Start: Network Setup (Laptop + Raspberry Pi)

This guide gets you up and running quickly with the frontend on your laptop and backend on Raspberry Pi.

## Architecture

```
Laptop (Frontend)  ←→  WiFi Network  ←→  Raspberry Pi (Backend + Vosk + Microphone)
```

## 5-Minute Setup

### Step 1: Start Backend on Raspberry Pi

```bash
# On Raspberry Pi
cd backend
python3 app.py
```

The backend will start on `http://0.0.0.0:5000` (accessible from network).

### Step 2: Find Raspberry Pi IP Address

```bash
# On Raspberry Pi
hostname -I
```

Example output: `192.168.1.100`

### Step 3: Configure Frontend on Laptop

**Option A: Use the configuration script (Recommended)**

```bash
# On your laptop (Linux/Mac)
chmod +x configure_frontend.sh
./configure_frontend.sh

# On your laptop (Windows)
configure_frontend.bat
```

**Option B: Manual configuration**

Edit `frontend/.env.production`:

```env
VITE_API_URL=http://192.168.1.100:5000
```

Replace `192.168.1.100` with your Raspberry Pi's IP from Step 2.

### Step 4: Build and Run Frontend on Laptop

```bash
# On your laptop
cd frontend
npm install
npm run build
npx serve -s dist -p 3000
```

### Step 5: Open in Browser

Open `http://localhost:3000` on your laptop.

## Test the Connection

1. Register/login
2. Click "Start Recording"
3. Speak into the microphone connected to the Raspberry Pi
4. Watch the live transcript appear on your laptop screen

## Troubleshooting

### Can't connect to backend?

```bash
# Test from laptop
curl http://192.168.1.100:5000/api/health
```

If this fails:
- Check both devices are on the same WiFi
- Verify backend is running on Raspberry Pi
- Check firewall settings on Raspberry Pi

### Microphone not working?

The microphone must be connected to the **Raspberry Pi**, not your laptop.

Test on Raspberry Pi:
```bash
python3 backend/test_mic.py
```

## What Happens When You Click "Start Recording"?

1. **Laptop frontend** sends HTTP request to Raspberry Pi: `POST http://192.168.1.100:5000/api/recordings/start`
2. **Raspberry Pi backend** starts recording from its connected microphone
3. **Vosk** (on Raspberry Pi) processes audio in real-time
4. **Laptop frontend** polls for transcript updates: `GET http://192.168.1.100:5000/api/recordings/{id}/transcript`
5. **Live transcript** appears on your laptop screen as you speak
6. When you click "Stop", the backend generates a summary and saves everything

## Need More Details?

See [NETWORK_SETUP.md](NETWORK_SETUP.md) for comprehensive documentation including:
- Static IP configuration
- Security considerations
- Advanced troubleshooting
- Network architecture diagrams
