# Hardware Quick Start Guide

## Computer B Setup (3 Steps)

### Step 1: Configure Backend URL

Edit `config.py`:
```python
BACKEND_URL = 'http://192.168.1.100:8000'  # Replace with Computer A's IP
ARDUINO_PORT = 'COM6'  # Adjust for your system
```

### Step 2: Upload Arduino Sketch

**Option A - Buttons:**
- Open `ArduinoCode/ArduinoCode.ino` in Arduino IDE
- Upload to Arduino

**Option B - Sensors:**
- Open `Sensors/SetUpSensors/SetUpSensors.ino` in Arduino IDE  
- Upload to Arduino

### Step 3: Run Python Script

Install dependencies (first time only):
```bash
pip install pyserial requests
```

**For Buttons:**
```bash
python hardware_buttons.py
```

**For Sensors:**
```bash
python hardware_sensors.py
```

## Expected Output

```
Starting Hardware Button Controller...
Backend URL: http://192.168.1.100:8000
Arduino Port: COM6
Button Mapping: 1=Hard, 2=Medium, 3=Good, 4=Easy
--------------------------------------------------
✓ Successfully connected to Arduino on COM6
```

## Controls

### Buttons
- **Button 1** → Show Card + Hard rating
- **Button 2** → Show Card + Medium rating  
- **Button 3** → Show Card + Good rating
- **Button 4** → Show Card + Easy rating

### Sensors (3-Step Gesture)
1. **Place hand near sensor** (<30cm for ~1 sec) → Detected
2. **Wait 1 second** → System confirms
3. **Remove hand** (>30cm for ~1 sec) → Rating sent

- **Sensor X** → Hard rating
- **Sensor Y** → Good rating

**Total time per gesture**: ~3 seconds + 1 second cooldown

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't connect to Arduino | Close Arduino IDE Serial Monitor |
| Wrong port | Check Device Manager (Windows) or `ls /dev/tty*` (Linux) |
| Connection error | Verify Computer A's IP and that backend is running |
| Actions ignored | Make sure you're on the Study page in the frontend |

## Arduino Wiring

### Buttons (ArduinoCode.ino)
```
Button 1 → Pin 2 + GND
Button 2 → Pin 3 + GND  
Button 3 → Pin 4 + GND
Button 4 → Pin 5 + GND
```

### Sensors (SetUpSensors.ino)
```
Sensor X:
  Trigger → Pin 13
  Echo → Pin 12
  VCC → 5V
  GND → GND

Sensor Y:
  Trigger → Pin 11
  Echo → Pin 10
  VCC → 5V
  GND → GND
```

## Full Documentation

See `HARDWARE_SETUP_GUIDE.md` for detailed setup and troubleshooting.

