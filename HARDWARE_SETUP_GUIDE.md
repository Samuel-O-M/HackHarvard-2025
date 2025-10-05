# Hardware Integration Setup Guide

This guide walks you through setting up the hardware controller system where Computer A hosts the backend and frontend, and Computer B runs the hardware interface.

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Computer A (Host)               │
│  ┌─────────────┐    ┌────────────────┐ │
│  │  Frontend   │    │    Backend     │ │
│  │  Port 3000  │◄───┤   Port 8000    │ │
│  └─────────────┘    └────────────────┘ │
│                            ▲            │
└────────────────────────────┼────────────┘
                             │ HTTP/API
                             │
                     Network Connection
                             │
┌────────────────────────────┼────────────┐
│         Computer B (Hardware)           │
│                            │            │
│  ┌──────────────────────┐  │            │
│  │  Hardware Scripts    ├──┘            │
│  │  - Buttons           │               │
│  │  - Sensors           │               │
│  └──────────┬───────────┘               │
│             │ Serial                     │
│  ┌──────────▼───────────┐               │
│  │      Arduino         │               │
│  │  - 4 Buttons         │               │
│  │  - 2 Distance Sensors│               │
│  └──────────────────────┘               │
└─────────────────────────────────────────┘
```

## Prerequisites

### Computer A (Host)
- Python 3.8+
- Node.js 14+
- Backend and frontend codebases

### Computer B (Hardware Controller)
- Python 3.8+
- Arduino IDE
- Arduino board (Uno, Nano, etc.)
- USB cable
- Hardware components:
  - 4 push buttons OR
  - 2 ultrasonic distance sensors (HC-SR04)

## Step-by-Step Setup

### Part 1: Computer A Setup

#### 1.1 Start the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Important**: The `--host 0.0.0.0` flag allows the backend to accept connections from other computers on the network.

#### 1.2 Find Computer A's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

**Linux/Mac:**
```bash
ifconfig
# or
ip addr show
```
Look for "inet" address (e.g., 192.168.1.100)

#### 1.3 Update Frontend Configuration

Create or edit `frontend/.env`:

```
VITE_BACKENDS=http://localhost:8000,http://<Computer-A-IP>:8000
```

Replace `<Computer-A-IP>` with the IP address from step 1.2.

#### 1.4 Start the Frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 3000
```

#### 1.5 Test Local Access

Open a browser and visit:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

### Part 2: Computer B Setup

#### 2.1 Verify Network Access

From Computer B, test that you can reach Computer A:

```bash
# Test backend
curl http://<Computer-A-IP>:8000

# Or open in browser
# http://<Computer-A-IP>:3000
```

#### 2.2 Configure Hardware Scripts

Edit `hardware/config.py`:

```python
# Replace 'x' with Computer A's actual IP address
BACKEND_URL = 'http://192.168.1.100:8000'  # Example

# Set your Arduino port
ARDUINO_PORT = 'COM6'  # Windows
# ARDUINO_PORT = '/dev/ttyUSB0'  # Linux
# ARDUINO_PORT = '/dev/cu.usbserial-XXX'  # Mac

BAUD_RATE = 9600
```

#### 2.3 Upload Arduino Sketch

**For Button Setup:**
1. Open `hardware/ArduinoCode/ArduinoCode.ino` in Arduino IDE
2. Connect Arduino via USB
3. Select: Tools → Board → Your Arduino model
4. Select: Tools → Port → Your COM port
5. Click Upload (→ button)

**For Sensor Setup:**
1. Open `hardware/Sensors/SetUpSensors/SetUpSensors.ino` in Arduino IDE
2. Connect Arduino via USB
3. Select correct board and port
4. Click Upload

#### 2.4 Install Python Dependencies

```bash
cd hardware
pip install pyserial requests
```

#### 2.5 Run Hardware Controller

**For Buttons:**
```bash
python hardware_buttons.py
```

**For Sensors:**
```bash
python hardware_sensors.py
```

You should see:
```
Starting Hardware Button Controller...
Backend URL: http://192.168.1.100:8000
Arduino Port: COM6
✓ Successfully connected to Arduino on COM6
```

### Part 3: Testing the System

#### 3.1 Test Page Tracking

1. Open the frontend on Computer A: `http://localhost:3000`
2. Watch the backend terminal - you should see page change notifications
3. Navigate between Study/Stats/Manage pages
4. Verify backend logs show page changes

#### 3.2 Test Button Input (if using buttons)

1. Navigate to the Study page
2. Press any button on Arduino
3. Check hardware script terminal for confirmation
4. The study page should show the card answer
5. Press button 1-4 to submit a rating

#### 3.3 Test Sensor Input (if using sensors)

1. Navigate to the Study page
2. Wave your hand in front of Sensor X (distance < 30cm)
3. Keep it there for ~1 second (4 out of 5 readings)
4. The hardware script should show "🔴 Sensor X detected!"
5. The study page should react accordingly

#### 3.4 Test Page Isolation

1. Navigate to Stats or Manage page
2. Press buttons or trigger sensors
3. Hardware script should show: "Action ignored: not on study page"

## Hardware Button Mapping

| Button | Rating | Description |
|--------|--------|-------------|
| 1 | Hard (1) | "Again" - Didn't remember |
| 2 | Medium (2) | "Hard" - Struggled to remember |
| 3 | Good (3) | "Good" - Remembered with effort |
| 4 | Easy (4) | "Easy" - Remembered easily |

All buttons also trigger "Show Answer" before submitting the rating.

## Hardware Sensor Mapping

| Sensor | Detection | Rating | Description |
|--------|-----------|--------|-------------|
| X (distance1) | <30cm (4/5 pulses) | Hard (1) | Quick gesture = Hard rating |
| Y (distance2) | <30cm (4/5 pulses) | Good (3) | Quick gesture = Good rating |

Both sensors also trigger "Show Answer" before submitting the rating.

## Troubleshooting

### "No backend available" in frontend

**Problem**: Frontend can't connect to backend.

**Solutions**:
1. Verify backend is running: `http://<Computer-A-IP>:8000`
2. Check firewall settings on Computer A
3. Ensure both computers are on same network
4. Verify `.env` file has correct BACKEND_URL

### "Failed to connect to Arduino"

**Problem**: Python script can't communicate with Arduino.

**Solutions**:
1. Check USB connection
2. Verify correct port in `config.py`
3. Close Arduino IDE Serial Monitor (locks the port)
4. Try unplugging and replugging Arduino
5. Check Device Manager (Windows) or `ls /dev/tty*` (Linux/Mac)

### "Connection error" when sending to backend

**Problem**: Hardware script can't reach backend API.

**Solutions**:
1. Verify `BACKEND_URL` in `config.py` is correct
2. Test with: `curl http://<IP>:8000/hardware/page`
3. Check network connectivity: `ping <Computer-A-IP>`
4. Verify firewall allows port 8000
5. Ensure backend is running with `--host 0.0.0.0`

### Hardware inputs not working

**Problem**: Buttons/sensors detected but no action on frontend.

**Solutions**:
1. Verify you're on the Study page
2. Check browser console for errors (F12)
3. Verify backend is receiving actions (check terminal logs)
4. Check hardware script shows "Backend confirmed: ..."

### Sensors always triggering

**Problem**: Sensors detecting when nothing is nearby.

**Solutions**:
1. Adjust `SENSOR_THRESHOLD` in `config.py` (try 20 or 40)
2. Adjust `SENSOR_DETECTION_COUNT` (try 3 or 5)
3. Check sensor wiring (especially Echo pin)
4. Add delay/cooldown (already set to 2 seconds)

### Multiple actions being triggered

**Problem**: One button press causes multiple actions.

**Solutions**:
1. This is expected - button press triggers both "show" and "rating"
2. The 200ms delay between actions is intentional
3. If getting double-presses, check Arduino button debouncing

## Network Security Notes

When exposing the backend with `--host 0.0.0.0`:

1. **Local Network Only**: This setup works on local networks (home/office)
2. **Firewall**: Your firewall may block incoming connections
3. **Not for Internet**: Don't expose this to the public internet without authentication
4. **Alternative**: Use SSH tunneling for added security if needed

## Advanced Configuration

### Adjusting Sensor Sensitivity

Edit `hardware/config.py`:

```python
# Distance threshold (cm)
SENSOR_THRESHOLD = 30  # Lower = closer required

# Detection window
SENSOR_WINDOW_SIZE = 5  # Number of readings to check
SENSOR_DETECTION_COUNT = 4  # Minimum detections needed

# Example: Very sensitive (easy to trigger)
SENSOR_THRESHOLD = 50
SENSOR_DETECTION_COUNT = 3

# Example: Less sensitive (harder to trigger)
SENSOR_THRESHOLD = 20
SENSOR_DETECTION_COUNT = 5
```

### Adjusting Polling Rate

Edit `frontend/src/pages/Study.jsx`, line 45:

```javascript
pollInterval = setInterval(pollHardware, 200)  // milliseconds
```

Lower values = more responsive but more API calls.

### Using Both Buttons and Sensors

You can run both hardware scripts simultaneously:

**Terminal 1:**
```bash
python hardware_buttons.py
```

**Terminal 2:**
```bash
python hardware_sensors.py
```

Both will send actions to the same backend endpoint.

## File Reference

### Computer A Files
- `backend/main.py` - Backend API with hardware endpoints
- `frontend/src/App.jsx` - Frontend with page tracking
- `frontend/src/pages/Study.jsx` - Study page with hardware polling
- `frontend/src/api/backend.js` - Backend connection logic

### Computer B Files
- `hardware/config.py` - Configuration (edit this!)
- `hardware/hardware_buttons.py` - Button controller script
- `hardware/hardware_sensors.py` - Sensor controller script
- `hardware/ArduinoCode/ArduinoCode.ino` - Button Arduino sketch
- `hardware/Sensors/SetUpSensors/SetUpSensors.ino` - Sensor Arduino sketch

## Support

If you encounter issues not covered in this guide:

1. Check the backend terminal for error messages
2. Check the hardware script terminal for connection issues
3. Check browser console (F12) for frontend errors
4. Verify all configuration files are correctly edited
5. Try testing each component independently (Arduino → Python → Backend → Frontend)

