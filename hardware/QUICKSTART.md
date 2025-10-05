# Hardware Quick Start

Get hardware controllers running in 3 steps!

## Prerequisites

- Arduino Uno/Nano (or compatible)
- USB cable
- Arduino IDE installed
- Python 3.8+ with pip
- Backend running on Computer A (or same computer)

## 3-Step Setup

### Step 1: Configure Backend URL

Edit `hardware/config.py`:
```python
BACKEND_URL = 'http://192.168.1.100:8000'  # Computer A's IP
ARDUINO_PORT = 'COM6'  # Your Arduino port
```

**Find Computer A's IP:**
- Windows: `ipconfig`
- Mac/Linux: `ifconfig` or `ip addr`

**Find Arduino Port:**
- Windows: Device Manager → Ports (COM & LPT)
- Mac: `ls /dev/tty.*`
- Linux: `ls /dev/tty*`

---

### Step 2: Upload Arduino Sketch

**Option A - Buttons:**
1. Open `ArduinoCode/ArduinoCode.ino` in Arduino IDE
2. Select: Tools → Board → Your Arduino
3. Select: Tools → Port → Your COM port
4. Click Upload (→) button

**Option B - Sensors:**
1. Open `Sensors/SetUpSensors/SetUpSensors.ino` in Arduino IDE
2. Select: Tools → Board → Your Arduino
3. Select: Tools → Port → Your COM port
4. Click Upload (→) button

---

### Step 3: Run Python Script

Install dependencies (first time only):
```bash
pip install pyserial requests
```

**For Buttons:**
```bash
cd hardware
python hardware_buttons.py
```

**For Sensors:**
```bash
cd hardware
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

Now press buttons or use sensor gestures!

## Controls

### Button Controller

- **Button 1** → Show Answer + Hard (1)
- **Button 2** → Show Answer + Medium (2)
- **Button 3** → Show Answer + Good (3)
- **Button 4** → Show Answer + Easy (4)

**Each button press:**
1. Shows the answer immediately
2. Submits the rating automatically

---

### Sensor Controller (3-Step Gesture)

**Sensor X** → Hard rating (1)  
**Sensor Y** → Good rating (3)

**How to use:**
1. **Place hand near sensor** (<30cm for ~1 sec) → Detection starts
2. **Wait 1 second** → System confirms gesture
3. **Remove hand** (>30cm for ~1 sec) → Rating submitted

**Total time:** ~3 seconds + 1 second cooldown

---

## Wiring

### Buttons

```
Button 1 → Arduino Pin 2 + GND
Button 2 → Arduino Pin 3 + GND
Button 3 → Arduino Pin 4 + GND
Button 4 → Arduino Pin 5 + GND
```

No resistors needed (internal pull-ups used).

---

### Sensors

**Sensor X:**
```
VCC → 5V
GND → GND
Trig → Pin 13
Echo → Pin 12
```

**Sensor Y:**
```
VCC → 5V
GND → GND
Trig → Pin 11
Echo → Pin 10
```

---

## Quick Fixes

| Problem | Solution |
|---------|----------|
| Can't connect to Arduino | Close Arduino IDE Serial Monitor |
| Wrong port | Check Device Manager (Windows) or `ls /dev/tty*` |
| Connection error | Verify backend is running and IP is correct |
| Actions ignored | Make sure you're on Study page in frontend |
| Sensors not detecting | Increase `SENSOR_THRESHOLD` in config.py to 40 |

## Test Arduino Connection

1. Open Arduino IDE
2. Tools → Serial Monitor
3. Set baud rate to 9600
4. **Buttons**: Press buttons → See numbers 1-4
5. **Sensors**: Wave hand → See distance values

## Usage Tips

### For Buttons:
- Press firmly and release
- One button per card review
- No need to look at screen

### For Sensors:
- Hold hand steady for 1 second
- Wait for confirmation
- Remove hand deliberately
- Complete the full 3-step gesture

## Full Documentation

See [Hardware README](README.md) for:
- Detailed setup instructions
- Complete wiring diagrams
- Troubleshooting guide
- Configuration options
- Design decisions

## Success Checklist

- [ ] Config.py updated with correct IP and port
- [ ] Arduino sketch uploaded successfully
- [ ] Python dependencies installed
- [ ] Backend running and accessible
- [ ] Frontend open on Study page
- [ ] Python script connects to Arduino
- [ ] Button presses or gestures trigger actions
- [ ] Actions appear in frontend

**Ready!** Your hardware controller is now connected.

