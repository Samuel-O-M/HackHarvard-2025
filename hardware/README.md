# Hardware - Accessible Input Controllers

Arduino-based hardware controllers providing alternative input methods for hands-free, accessible language learning. Supports both physical buttons and contactless distance sensors.

## Overview

The hardware component enables users to control the language learning application without a keyboard or mouse. This is especially beneficial for users with reduced mobility, limited fine motor control, or those who prefer hands-free interaction. The system uses Arduino microcontrollers connected to Python bridge scripts that communicate with the backend API.

## Features

- **Two Input Modes**: Physical buttons or contactless distance sensors
- **Multi-Computer Support**: Hardware controller runs on separate computer from backend
- **Gesture Detection**: 3-step deliberate gesture system for sensors
- **Cooldown Protection**: Prevents accidental double-inputs
- **Real-Time Feedback**: Console logging of all actions
- **Configurable Thresholds**: Customizable sensor detection distance
- **Page-Aware**: Only processes inputs when on Study page
- **Auto-Reconnect**: Handles connection interruptions gracefully

## Architecture

### System Components

```
Computer A (Backend + Frontend)
├── Backend API (port 8000)
└── Frontend UI (port 3000)

Computer B (Hardware Controller)
├── Arduino (USB connection)
│   ├── Buttons (4 digital inputs)
│   └── Sensors (2 ultrasonic sensors)
└── Python Bridge Script
    ├── Reads serial data from Arduino
    └── Sends HTTP requests to Computer A
```

### Communication Flow

```
User Input → Arduino → Serial (USB) → Python Script → HTTP → Backend API → Action Queue → Frontend Poll
```

## Hardware Components

### Option 1: Button Controller

**Components:**
- Arduino Uno/Nano (or compatible)
- 4 push buttons
- 4 10kΩ resistors (for pull-up/pull-down)
- Breadboard and jumper wires

**Button Mapping:**
- **Button 1** (Pin 2) → Hard rating (1)
- **Button 2** (Pin 3) → Medium rating (2)
- **Button 3** (Pin 4) → Good rating (3)
- **Button 4** (Pin 5) → Easy rating (4)

**Behavior:**
Each button press triggers TWO actions:
1. Show card (reveal answer)
2. Submit rating corresponding to button

This design reduces the number of inputs needed and streamlines the review process.

---

### Option 2: Sensor Controller

**Components:**
- Arduino Uno/Nano (or compatible)
- 2 HC-SR04 ultrasonic distance sensors
- Breadboard and jumper wires

**Sensor Mapping:**
- **Sensor X** (Pins 13/12) → Hard rating (1)
- **Sensor Y** (Pins 11/10) → Good rating (3)

**Gesture System (3-Step Process):**

1. **Detection Phase** (~1 second)
   - Place hand within 30cm of sensor
   - System detects consistent proximity
   - Console logs "Detected"

2. **Confirmation Phase** (~1 second)
   - Keep hand in place for 1 second
   - System confirms deliberate gesture
   - Prevents accidental triggers

3. **Completion Phase** (~1 second)
   - Remove hand beyond 30cm
   - System sends rating to backend
   - Console logs "Rating sent"
   - 1-second cooldown enforced by backend

**Total Gesture Time:** ~3 seconds + 1 second cooldown = 4 seconds per review

**Advantages:**
- Contactless interaction
- No physical buttons needed
- Accessible for users with limited grip strength
- Reduced repetitive motion

## Arduino Sketches

### Button Controller Arduino Code

**File:** `ArduinoCode/ArduinoCode.ino`

```cpp
// Pin definitions
const int BUTTON_PINS[] = {2, 3, 4, 5};
const int NUM_BUTTONS = 4;

void setup() {
  Serial.begin(9600);
  
  // Setup button pins with internal pull-up
  for (int i = 0; i < NUM_BUTTONS; i++) {
    pinMode(BUTTON_PINS[i], INPUT_PULLUP);
  }
}

void loop() {
  for (int i = 0; i < NUM_BUTTONS; i++) {
    if (digitalRead(BUTTON_PINS[i]) == LOW) {
      Serial.println(i + 1);  // Send button number (1-4)
      delay(300);  // Debounce delay
    }
  }
}
```

**How It Works:**
1. Sets up 4 pins as inputs with pull-up resistors
2. Continuously checks button states
3. When button pressed (pin goes LOW), sends button number via serial
4. 300ms delay prevents button bounce

---

### Sensor Controller Arduino Code

**File:** `Sensors/SetUpSensors/SetUpSensors.ino`

```cpp
// Sensor X pins
const int TRIG_PIN_1 = 13;
const int ECHO_PIN_1 = 12;

// Sensor Y pins
const int TRIG_PIN_2 = 11;
const int ECHO_PIN_2 = 10;

void setup() {
  Serial.begin(9600);
  
  pinMode(TRIG_PIN_1, OUTPUT);
  pinMode(ECHO_PIN_1, INPUT);
  pinMode(TRIG_PIN_2, OUTPUT);
  pinMode(ECHO_PIN_2, INPUT);
}

long measureDistance(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  long duration = pulseIn(echoPin, HIGH);
  long distance = duration * 0.034 / 2;  // Convert to cm
  
  return distance;
}

void loop() {
  long distance1 = measureDistance(TRIG_PIN_1, ECHO_PIN_1);
  long distance2 = measureDistance(TRIG_PIN_2, ECHO_PIN_2);
  
  Serial.print(distance1);
  Serial.print(",");
  Serial.println(distance2);
  
  delay(100);  // 10Hz update rate
}
```

**How It Works:**
1. Sends ultrasonic pulse from trigger pin
2. Measures echo return time
3. Converts time to distance in centimeters
4. Sends both sensor distances via serial (comma-separated)
5. Updates 10 times per second

## Python Bridge Scripts

### Button Controller Script

**File:** `hardware_buttons.py`

**Key Functions:**

```python
def send_hardware_input(action, rating=None):
    """Send hardware input to backend"""
    payload = {"action": action}
    if rating is not None:
        payload["rating"] = rating
    
    response = requests.post(
        f"{BACKEND_URL}/hardware/input",
        json=payload,
        timeout=2
    )
    return response.status_code == 200
```

**Main Loop:**
1. Establishes serial connection to Arduino
2. Reads button data from serial port
3. For each button press:
   - Sends "show_card" action to backend
   - Waits 100ms
   - Sends "submit_rating" with corresponding rating
4. Handles connection errors gracefully
5. Logs all actions to console

**Button to Rating Mapping:**
```python
BUTTON_TO_RATING = {
    1: 1,  # Hard
    2: 2,  # Medium
    3: 3,  # Good
    4: 4   # Easy
}
```

---

### Sensor Controller Script

**File:** `hardware_sensors.py`

**Key Configuration:**
```python
SENSOR_THRESHOLD = 30        # Detection distance (cm)
SENSOR_WINDOW_SIZE = 5       # Consecutive readings to check
SENSOR_DETECTION_COUNT = 4   # Detections needed in window
WAIT_TIME = 1.0             # Seconds to wait after detection
```

**Gesture State Machine:**

```python
State: IDLE
├─> Hand detected (<30cm for ~1s) → DETECTED
│
State: DETECTED
├─> Wait 1 second → WAITING
│
State: WAITING
├─> Hand removed (>30cm for ~1s) → Send rating → IDLE
└─> Timeout (no removal) → IDLE
```

**Detection Algorithm:**
```python
def is_sensor_triggered(recent_distances):
    """Check if sensor consistently detects proximity"""
    if len(recent_distances) < SENSOR_WINDOW_SIZE:
        return False
    
    # Get last N readings
    window = recent_distances[-SENSOR_WINDOW_SIZE:]
    
    # Count how many are below threshold
    detections = sum(1 for d in window if d < SENSOR_THRESHOLD)
    
    # Require 4 out of 5 readings below threshold
    return detections >= SENSOR_DETECTION_COUNT
```

**Removal Detection:**
```python
def is_hand_removed(recent_distances):
    """Check if hand removed (far readings)"""
    if len(recent_distances) < SENSOR_WINDOW_SIZE:
        return False
    
    window = recent_distances[-SENSOR_WINDOW_SIZE:]
    far_readings = sum(1 for d in window if d >= SENSOR_THRESHOLD)
    
    return far_readings >= SENSOR_DETECTION_COUNT
```

**Gesture Flow:**
1. Monitor sensor distances continuously
2. When proximity detected for ~1 second → Enter DETECTED state
3. Wait 1 additional second for confirmation → Enter WAITING state
4. When hand removed for ~1 second → Send rating + Show card
5. Backend enforces 1-second cooldown
6. Return to IDLE state

---

## Configuration

### `config.py`

```python
# Backend URL - Replace 'x' with Computer A's IP address
BACKEND_URL = 'http://192.168.1.100:8000'

# Arduino port - System-specific
ARDUINO_PORT = 'COM6'  # Windows: COM3, COM4, etc.
                       # Linux/Mac: /dev/ttyUSB0, /dev/ttyACM0, etc.

# Baud rate for serial communication
BAUD_RATE = 9600

# Sensor detection threshold (cm)
SENSOR_THRESHOLD = 30

# Number of consecutive pulses to check
SENSOR_WINDOW_SIZE = 5

# Detections needed within window (4 out of 5)
SENSOR_DETECTION_COUNT = 4
```

### Finding Your Arduino Port

**Windows:**
1. Open Device Manager
2. Expand "Ports (COM & LPT)"
3. Look for "Arduino" or "USB Serial Device"
4. Note the COM port (e.g., COM6)

**Mac:**
```bash
ls /dev/tty.*
# Look for /dev/tty.usbmodem* or /dev/tty.usbserial*
```

**Linux:**
```bash
ls /dev/tty*
# Look for /dev/ttyUSB0 or /dev/ttyACM0

# Grant permissions if needed
sudo chmod 666 /dev/ttyACM0
```

### Finding Computer A's IP Address

**Windows:**
```bash
ipconfig
# Look for "IPv4 Address" under your network adapter
```

**Mac:**
```bash
ifconfig
# Look for "inet" under en0 (Wi-Fi) or en1 (Ethernet)
```

**Linux:**
```bash
ip addr
# or
hostname -I
```

## Setup Instructions

### Step 1: Upload Arduino Sketch

**For Buttons:**
1. Open Arduino IDE
2. File → Open → `ArduinoCode/ArduinoCode.ino`
3. Tools → Board → Select your Arduino model
4. Tools → Port → Select correct COM port
5. Click Upload button

**For Sensors:**
1. Open Arduino IDE
2. File → Open → `Sensors/SetUpSensors/SetUpSensors.ino`
3. Tools → Board → Select your Arduino model
4. Tools → Port → Select correct COM port
5. Click Upload button

### Step 2: Install Python Dependencies

On Computer B:
```bash
pip install pyserial requests
```

### Step 3: Configure Backend URL

Edit `config.py`:
```python
BACKEND_URL = 'http://192.168.1.100:8000'  # Computer A's IP
ARDUINO_PORT = 'COM6'  # Your Arduino port
```

### Step 4: Run Bridge Script

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

### Expected Output

```
Starting Hardware Button Controller...
Backend URL: http://192.168.1.100:8000
Arduino Port: COM6
Button Mapping: 1=Hard, 2=Medium, 3=Good, 4=Easy
--------------------------------------------------
✓ Successfully connected to Arduino on COM6

Button 1 pressed
  → Backend confirmed: show_card
  → Backend confirmed: submit_rating (rating: 1)
```

## Testing

### Test Arduino Connection

**Using Arduino IDE Serial Monitor:**
1. Upload sketch to Arduino
2. Tools → Serial Monitor
3. Set baud rate to 9600
4. Press buttons or wave hand near sensors
5. Should see numbers (buttons) or distances (sensors)

### Test Backend Connection

**Using cURL:**
```bash
curl -X POST http://192.168.1.100:8000/hardware/input \
  -H "Content-Type: application/json" \
  -d '{"action":"show_card"}'
```

Expected response:
```json
{"status":"ok","action":"show_card"}
```

### Test Full System

1. Start backend on Computer A
2. Start frontend on Computer A
3. Run hardware script on Computer B
4. Navigate to Study page in browser
5. Press button or use sensor gesture
6. Card should show answer automatically
7. Rating should be submitted automatically

## Troubleshooting

### "Failed to connect to Arduino"

**Causes:**
- Arduino not connected via USB
- Wrong COM port in config.py
- Arduino IDE Serial Monitor is open (locks port)
- Driver not installed

**Solutions:**
```bash
# Check Arduino is recognized
# Windows: Device Manager
# Linux: ls /dev/tty*
# Mac: ls /dev/tty.*

# Try different port
ARDUINO_PORT = 'COM7'  # or COM5, COM8, etc.

# Close Arduino IDE Serial Monitor

# Reinstall Arduino drivers
```

### "Connection error" to Backend

**Causes:**
- Backend not running
- Wrong IP address in config.py
- Firewall blocking connection
- Computers on different networks

**Solutions:**
```bash
# Test backend directly
curl http://192.168.1.100:8000/

# Check firewall (Windows)
# Allow port 8000 in Windows Firewall

# Verify both computers on same network
# Check Wi-Fi network or use ethernet

# Try localhost if on same computer
BACKEND_URL = 'http://localhost:8000'
```

### "Action ignored: not on study page"

**This is normal behavior!**

Hardware inputs only work on the Study page. Navigate to Study page in the frontend.

### Sensors Not Detecting

**Causes:**
- Sensor wiring incorrect
- Sensor threshold too low/high
- Sensor damaged or faulty
- Not completing 3-step gesture

**Solutions:**
```python
# Adjust threshold in config.py
SENSOR_THRESHOLD = 40  # Increase to 40cm

# Check wiring matches Arduino sketch
# Sensor X: Trig=13, Echo=12
# Sensor Y: Trig=11, Echo=10

# Test in Arduino Serial Monitor
# Should see distance values

# Ensure completing full gesture:
# 1. Hand near (<30cm) for 1 second
# 2. Wait 1 second
# 3. Remove hand (>30cm) for 1 second
```

### "Cooldown active" Message

**This is normal!**

Backend enforces 1-second cooldown between gestures to prevent rapid-fire inputs. Wait briefly before next gesture.

### Button Presses Not Registered

**Causes:**
- Button not properly connected
- Button wiring incorrect
- Debounce delay too short

**Solutions:**
```cpp
// In Arduino code, increase debounce delay
delay(500);  // Increase from 300 to 500ms

// Check button wiring
// Button pin → Arduino pin
// Button GND → Arduino GND

// Test buttons in Serial Monitor
```

## Hardware Behavior Summary

### Study Page

| Input | Action 1 | Action 2 | Total Time |
|-------|----------|----------|------------|
| Button 1 | Show Answer | Submit Hard (1) | Instant |
| Button 2 | Show Answer | Submit Medium (2) | Instant |
| Button 3 | Show Answer | Submit Good (3) | Instant |
| Button 4 | Show Answer | Submit Easy (4) | Instant |
| Sensor X Gesture | Show Answer | Submit Hard (1) | ~3-4 seconds |
| Sensor Y Gesture | Show Answer | Submit Good (3) | ~3-4 seconds |

### Manage Page

All hardware inputs are ignored.

### Stats Page

All hardware inputs are ignored.

## Project Structure

```
hardware/
├── ArduinoCode/
│   └── ArduinoCode.ino              # Button controller sketch
├── Sensors/
│   ├── SetUpSensors/
│   │   └── SetUpSensors.ino         # Sensor controller sketch
│   ├── CheckeoSensors.py            # Legacy: Local test server
│   └── ReadingScryptSensors.py      # Legacy: Old sensor script
├── hardware_buttons.py              # Production button bridge
├── hardware_sensors.py              # Production sensor bridge
├── config.py                        # Configuration file
├── Checkeo.py                       # Legacy: Local test server
├── ReadingScrypt.py                 # Legacy: Old button script
├── README.md                        # This file
├── QUICKSTART.md                    # Fast setup guide
├── QUICK_START.md                   # Original quick start (deprecated)
└── SENSOR_BEHAVIOR.md               # Detailed sensor behavior docs
```

## Design Decisions

### Why 3-Step Gesture for Sensors?

**Problem:** Simple proximity detection causes accidental triggers.

**Solution:** Multi-step deliberate gesture:
1. Ensures intentional action
2. Reduces false positives
3. Provides time for user to reconsider
4. Makes system more predictable

### Why Combine "Show" and "Rate" Actions?

**Problem:** Separate buttons for "show" and "rate" require many inputs.

**Solution:** Single button does both:
- Simplifies hardware (4 buttons instead of 5+)
- Reduces cognitive load
- Speeds up review process
- Natural workflow: see answer → immediately rate

### Why 1-Second Cooldown?

**Problem:** Rapid repeated inputs cause confusion and errors.

**Solution:** Backend enforces cooldown:
- Prevents accidental double-submissions
- Ensures smooth card transitions
- Gives time for frontend to update
- Realistic review pace

## Future Enhancements

- **Wireless Communication**: Use Bluetooth or Wi-Fi instead of USB
- **Haptic Feedback**: Vibration motors for tactile confirmation
- **LED Indicators**: Show current state visually
- **Voice Commands**: Integrate speech recognition
- **Eye Tracking**: Alternative input for accessibility
- **Custom Gestures**: User-definable sensor gestures
- **Battery Power**: Portable, standalone operation

## Additional Documentation

- [QUICKSTART.md](QUICKSTART.md) - Fast setup guide
- [SENSOR_BEHAVIOR.md](SENSOR_BEHAVIOR.md) - Detailed sensor logic
- [Hardware Changes Summary](../HARDWARE_CHANGES_SUMMARY.md) - Recent updates

## Contributing

See main project [README](../README.md) for contribution guidelines.

---

Built for HackHarvard 2025
