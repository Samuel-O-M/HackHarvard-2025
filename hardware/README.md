# Hardware Controller Setup Guide

This guide explains how to set up the hardware controllers on Computer B to connect to the backend running on Computer A.

## System Overview

- **Computer A**: Hosts frontend (port 3000) and backend (port 8000)
- **Computer B**: Runs hardware controller scripts to send input from Arduino

## Hardware Components

### Option 1: Buttons
- 4 buttons connected to Arduino
- Arduino sketch: `ArduinoCode/ArduinoCode.ino`

### Option 2: Distance Sensors
- 2 ultrasonic distance sensors connected to Arduino
- Arduino sketch: `Sensors/SetUpSensors/SetUpSensors.ino`

## Setup Instructions

### 1. Configure Backend URL

Edit `hardware/config.py` and replace `'x'` with the actual IP address of Computer A:

```python
BACKEND_URL = 'http://192.168.1.100:8000'  # Example
```

Also verify the Arduino port matches your system:
- Windows: `'COM3'`, `'COM4'`, etc.
- Linux/Mac: `'/dev/ttyUSB0'`, `'/dev/ttyACM0'`, etc.

### 2. Upload Arduino Sketch

#### For Buttons:
1. Open `ArduinoCode/ArduinoCode.ino` in Arduino IDE
2. Connect Arduino via USB
3. Select correct board and port
4. Upload the sketch

#### For Distance Sensors:
1. Open `Sensors/SetUpSensors/SetUpSensors.ino` in Arduino IDE
2. Connect Arduino via USB
3. Select correct board and port
4. Upload the sketch

### 3. Install Python Dependencies

On Computer B, ensure you have the required Python packages:

```bash
pip install pyserial requests
```

### 4. Run the Hardware Controller

#### For Buttons:
```bash
cd hardware
python hardware_buttons.py
```

#### For Distance Sensors:
```bash
cd hardware
python hardware_sensors.py
```

## Hardware Behavior

### Button Controls (Study Mode Only)

| Button | Action | Rating |
|--------|--------|--------|
| Button 1 | Show Card + Submit | Hard (1) |
| Button 2 | Show Card + Submit | Medium (2) |
| Button 3 | Show Card + Submit | Good (3) |
| Button 4 | Show Card + Submit | Easy (4) |

### Distance Sensor Controls (Study Mode Only)

| Sensor | Detection | Action | Rating |
|--------|-----------|--------|--------|
| Sensor X | <30cm (4/5 pulses) | Show Card + Submit | Hard (1) |
| Sensor Y | <30cm (4/5 pulses) | Show Card + Submit | Good (3) |

**Note**: Pulses happen every 0.2 seconds. A cooldown of 2 seconds prevents repeated triggers.

### Behavior in Other Pages
- **Manage page**: Hardware inputs are ignored
- **Stats page**: Hardware inputs are ignored
- **Study page**: Hardware inputs trigger actions as described above

## Troubleshooting

### "Failed to connect to Arduino"
- Check Arduino is connected via USB
- Verify the correct port in `config.py`
- Close Arduino IDE Serial Monitor if open
- Try unplugging and replugging Arduino

### "Connection error" when sending to backend
- Verify Computer A's backend is running (`uvicorn main:app --host 0.0.0.0 --port 8000`)
- Check `BACKEND_URL` in `config.py` is correct
- Ensure both computers are on the same network
- Test connection: `curl http://<Computer-A-IP>:8000/`

### "Action ignored: not on study page"
- This is normal behavior when not on the Study page
- The frontend automatically notifies the backend of page changes
- Hardware inputs only work when on the Study page

### Sensors not detecting
- Verify Arduino sketch `SetUpSensors.ino` is uploaded
- Check sensor wiring (trigger and echo pins)
- Adjust `SENSOR_THRESHOLD` in `config.py` if needed (default: 30cm)
- Test sensors by checking the distance display in the terminal

## Configuration Options

Edit `config.py` to customize:

```python
# Detection threshold for sensors (in cm)
SENSOR_THRESHOLD = 30

# Number of consecutive pulses to check
SENSOR_WINDOW_SIZE = 5

# Detections needed within window
SENSOR_DETECTION_COUNT = 4
```

## Arduino Pin Connections

### Buttons (ArduinoCode.ino)
- Button 1: Pin 2
- Button 2: Pin 3
- Button 3: Pin 4
- Button 4: Pin 5

### Distance Sensors (SetUpSensors.ino)
- Sensor X (distance1):
  - Trigger: Pin 13
  - Echo: Pin 12
- Sensor Y (distance2):
  - Trigger: Pin 11
  - Echo: Pin 10

## Legacy Files

The following files are for local testing only and not needed for the main system:
- `Checkeo.py` - Local test server for buttons
- `ReadingScrypt.py` - Old button reading script
- `Sensors/CheckeoSensors.py` - Local test server for sensors
- `Sensors/ReadingScryptSensors.py` - Old sensor reading script

Use the new scripts instead:
- `hardware_buttons.py` - Production button controller
- `hardware_sensors.py` - Production sensor controller

