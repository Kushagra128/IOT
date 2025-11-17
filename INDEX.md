# 📚 Documentation Index

## 🚀 Quick Start (Read This First!)

**New to this project? Start here:**

1. **[START_HERE.md](START_HERE.md)** ⭐ **START HERE!**
   - 3 simple steps to get running
   - Quickest way to start

2. **[FINAL_SETUP_GUIDE.md](FINAL_SETUP_GUIDE.md)** 📖 **Complete Guide**
   - Step-by-step with screenshots
   - Everything explained
   - Troubleshooting included

3. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** 📋 **Command Reference**
   - All commands in one place
   - Quick lookup
   - Keep this handy!

---

## 📦 Installation & Setup

- **[TRANSFER_TO_PI.txt](TRANSFER_TO_PI.txt)** - How to transfer files to Pi
- **[RASPBERRY_PI_SETUP.md](RASPBERRY_PI_SETUP.md)** - Detailed Pi setup
- **[RASPBERRY_PI_COMPLETE_GUIDE.md](RASPBERRY_PI_COMPLETE_GUIDE.md)** - Complete Pi guide with troubleshooting
- **[install_rpi.sh](install_rpi.sh)** - Automatic installation script

---

## 🌐 Network Configuration

- **[NETWORK_SETUP.md](NETWORK_SETUP.md)** - Complete network setup guide
- **[QUICK_START_NETWORK.md](QUICK_START_NETWORK.md)** - 5-minute network setup
- **[configure_frontend.sh](configure_frontend.sh)** - Frontend configuration script
- **[configure_frontend.bat](configure_frontend.bat)** - Windows configuration script

---

## 🚀 Running the System

### Startup Scripts:

- **[run.sh](run.sh)** ⭐ **Easiest!** - One command to start everything
- **[start_backend.sh](start_backend.sh)** - Start backend only (recommended)
- **[start_all.sh](start_all.sh)** - Start backend + frontend together
- **[start_frontend.sh](start_frontend.sh)** - Start frontend only

### Which script to use?

| Script | Use When | Runs On |
|--------|----------|---------|
| `run.sh` | First time or easiest start | Raspberry Pi |
| `start_backend.sh` | Normal operation | Raspberry Pi |
| `start_all.sh` | Want both on Pi | Raspberry Pi |
| `start_frontend.sh` | Frontend on Pi | Raspberry Pi |

**Recommended:** Use `run.sh` or `start_backend.sh` on Pi, run frontend on laptop

---

## 📋 Deployment & Checklists

- **[READY_TO_DEPLOY.md](READY_TO_DEPLOY.md)** - Deployment overview
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Complete deployment checklist
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Detailed troubleshooting guide

---

## 📖 Project Documentation

- **[README.md](README.md)** - Project overview and features
- **[NETWORK_ARCHITECTURE.md](NETWORK_ARCHITECTURE.md)** - System architecture

---

## 🎯 Quick Navigation

### I want to...

**...get started quickly**
→ Read [START_HERE.md](START_HERE.md)

**...install on Raspberry Pi**
→ Run `./install_rpi.sh`

**...start the backend**
→ Run `./run.sh` or `./start_backend.sh`

**...configure my laptop**
→ Run `./configure_frontend.sh` in frontend folder

**...troubleshoot issues**
→ Read [RASPBERRY_PI_COMPLETE_GUIDE.md](RASPBERRY_PI_COMPLETE_GUIDE.md) troubleshooting section

**...find a command**
→ Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

**...understand the network setup**
→ Read [NETWORK_SETUP.md](NETWORK_SETUP.md)

**...see all deployment steps**
→ Check [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

---

## 🎓 Learning Path

### For Beginners:

1. Read [START_HERE.md](START_HERE.md)
2. Transfer files to Pi
3. Run `./install_rpi.sh`
4. Run `./run.sh`
5. Configure laptop frontend
6. Start recording!

### For Advanced Users:

1. Review [READY_TO_DEPLOY.md](READY_TO_DEPLOY.md)
2. Check [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
3. Customize [recorder_config.yml](iot-meeting-minutes/configs/recorder_config.yml)
4. Set up auto-start with systemd
5. Configure static IP

---

## 📁 Configuration Files

### Backend (Raspberry Pi):
- `iot-meeting-minutes/configs/recorder_config.yml` - Audio & model settings
- `backend/requirements_rpi.txt` - Python dependencies

### Frontend (Laptop):
- `frontend/.env.production` - Backend URL configuration
- `frontend/vite.config.js` - Vite configuration

---

## 🔧 Scripts Overview

### Installation:
- `install_rpi.sh` - Complete automatic installation

### Startup:
- `run.sh` - Simple one-command start
- `start_backend.sh` - Comprehensive backend startup
- `start_all.sh` - Start everything together
- `start_frontend.sh` - Frontend startup

### Configuration:
- `configure_frontend.sh` - Configure laptop frontend (Linux/Mac)
- `configure_frontend.bat` - Configure laptop frontend (Windows)

---

## 🎯 Most Important Files

### Must Read:
1. ⭐ [START_HERE.md](START_HERE.md) - Begin here
2. 📖 [FINAL_SETUP_GUIDE.md](FINAL_SETUP_GUIDE.md) - Complete guide
3. 📋 [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Command reference

### Must Run:
1. `./install_rpi.sh` - Install everything
2. `./run.sh` - Start backend
3. `./configure_frontend.sh` - Configure laptop

---

## 🆘 Getting Help

### Quick Fixes:
→ [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Troubleshooting section

### Detailed Help:
→ [RASPBERRY_PI_COMPLETE_GUIDE.md](RASPBERRY_PI_COMPLETE_GUIDE.md) - Full troubleshooting

### Common Issues:
→ [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Detailed solutions

---

## 📊 System Architecture

```
meeting-transcriber/
├── 📖 Documentation (you are here)
│   ├── START_HERE.md ⭐
│   ├── FINAL_SETUP_GUIDE.md
│   ├── QUICK_REFERENCE.md
│   └── ...
│
├── 🔧 Scripts
│   ├── run.sh ⭐
│   ├── start_backend.sh
│   ├── install_rpi.sh
│   └── ...
│
├── 🖥️ Backend (Raspberry Pi)
│   ├── app.py
│   ├── recording_service.py
│   └── ...
│
├── 💻 Frontend (Laptop)
│   ├── src/
│   └── ...
│
└── 🎤 Transcription Engine
    ├── recorder.py
    ├── stt_engine.py
    └── ...
```

---

## 🎉 Ready to Start?

1. **Read:** [START_HERE.md](START_HERE.md)
2. **Install:** Run `./install_rpi.sh`
3. **Start:** Run `./run.sh`
4. **Record:** Open browser and start recording!

**Everything is ready to go!** 🚀

---

## 📞 Quick Support

**Backend not starting?**
→ Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Troubleshooting section

**Frontend can't connect?**
→ Verify Pi IP in `frontend/.env.production`

**No microphone?**
→ Run `arecord -l` on Pi

**Need detailed help?**
→ Read [RASPBERRY_PI_COMPLETE_GUIDE.md](RASPBERRY_PI_COMPLETE_GUIDE.md)

---

**Happy Recording!** 🎤📝
