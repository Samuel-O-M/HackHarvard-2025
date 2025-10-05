# Sensor Detection Logic

## Overview

The sensor system now implements a sophisticated hand presence and removal detection system with cooldown protection.

## Detection Flow

### State Machine

Each sensor operates with a 3-state machine:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌──────┐    Hand Present    ┌───────────────┐    │
│  │ IDLE │ ─────────────────> │ HAND_DETECTED │    │
│  └──────┘   (4/5 < 30cm)     └───────────────┘    │
│      ▲                               │             │
│      │                          Wait 1 second      │
│      │                               │             │
│      │                               ▼             │
│      │                      ┌────────────────────┐ │
│      │  Hand Removed +      │ WAITING_FOR_       │ │
│      │  Action Triggered    │ REMOVAL            │ │
│      └────────────────────  └────────────────────┘ │
│          (4/5 > 30cm)                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Step-by-Step Process

#### 1. Hand Detection Phase (IDLE → HAND_DETECTED)

- **Trigger**: 4 out of 5 consecutive readings < 30cm
- **Duration**: ~1 second (5 readings × 0.2s per reading)
- **Action**: Log detection, move to next state
- **Display**: `🔴 Sensor X: Hand detected! (4/5 < 30cm)`

#### 2. Waiting Phase (HAND_DETECTED → WAITING_FOR_REMOVAL)

- **Duration**: 1 second
- **Purpose**: Ensure the hand gesture is deliberate, not accidental
- **Action**: Clear buffer for fresh removal readings
- **Display**: `🔴 Sensor X: Waiting for hand removal...`

#### 3. Hand Removal Phase (WAITING_FOR_REMOVAL → IDLE)

- **Trigger**: 4 out of 5 consecutive readings > 30cm
- **Duration**: ~1 second (5 readings × 0.2s per reading)
- **Action**: Send rating to backend
- **Display**: `🔴 Sensor X: Hand removed! Sending Hard rating...`

### Total Gesture Time

- **Minimum**: ~3 seconds total
  - 1 second for hand presence detection
  - 1 second mandatory wait
  - 1 second for hand removal detection

## Backend Cooldown

### Purpose

Prevents multiple card reviews from being processed too quickly, ensuring:
- Users have time to see the card
- System stability
- Realistic study pace

### Implementation

**Backend (`main.py`):**
```python
HARDWARE_COOLDOWN = 1.0  # seconds
```

- Cooldown starts when a rating is successfully submitted
- Any new hardware inputs are rejected during cooldown
- Response: `{"status": "cooldown", "wait_time": <remaining_seconds>}`

### Hardware Handling

Both button and sensor scripts check for cooldown status:

```python
if result.get("status") == "cooldown":
    print(f"  → Cooldown active: wait {result.get('wait_time', 0):.2f}s")
```

## Why This Design?

### 1. Prevents Accidental Triggers

Without removal detection, briefly passing your hand near the sensor would trigger actions.

### 2. Deliberate Gestures

The 3-second minimum gesture time ensures intentional input:
- User must place hand near sensor
- Hold for 1 second
- Deliberately remove hand

### 3. Natural Interaction

Mimics real-world button behavior:
- Press = Hand near sensor
- Release = Hand removed

### 4. System Protection

Backend cooldown ensures:
- Database consistency
- UI has time to update
- Prevents overwhelming the system

## Configuration

### Sensor Sensitivity (`hardware/config.py`)

```python
# Distance threshold (cm)
SENSOR_THRESHOLD = 30  # Closer = more sensitive

# Detection window
SENSOR_WINDOW_SIZE = 5  # Number of readings to check
SENSOR_DETECTION_COUNT = 4  # Detections needed (4/5 = 80%)
```

### Timing (`hardware/hardware_sensors.py`)

```python
WAIT_TIME = 1.0  # seconds between detection and removal check
```

### Backend Cooldown (`backend/main.py`)

```python
HARDWARE_COOLDOWN = 1.0  # seconds between accepted inputs
```

## Example Interaction

### Successful Gesture (Sensor X - Hard Rating)

```
Sensor X:  45cm ████████ | Sensor Y: 120cm ████████████████████
Sensor X:  28cm █████    | Sensor Y: 120cm ████████████████████

🔴 Sensor X: Hand detected! (4/5 < 30cm)

[1 second wait]

🔴 Sensor X: Waiting for hand removal...
Sensor X:  28cm █████    | Sensor Y: 120cm ████████████████████
Sensor X:  55cm ███████████| Sensor Y: 120cm ████████████████████

🔴 Sensor X: Hand removed! Sending Hard rating...
  → Backend confirmed: show_card
  → Backend confirmed: submit_rating (rating: 1)

Sensor X:  95cm ███████████████████| Sensor Y: 120cm ████████████████████
```

### Cooldown in Effect

If another gesture happens within 1 second:

```
🟢 Sensor Y: Hand detected! (4/5 < 30cm)
[1 second wait]
🟢 Sensor Y: Waiting for hand removal...
🟢 Sensor Y: Hand removed! Sending Good rating...
  → Backend confirmed: show_card
  → Cooldown active: wait 0.73s

[Sensor returns to idle, will try again next cycle]
```

## Troubleshooting

### "Hand removed!" message but no action

**Cause**: Backend cooldown is active from previous gesture.

**Solution**: This is normal. Wait 1 second between gestures.

### Sensor stays in "waiting for removal" state

**Cause**: Hand is still too close to sensor (< 30cm).

**Solution**: 
- Move hand further away (> 30cm)
- Check `SENSOR_THRESHOLD` setting
- Verify sensor is not blocked or detecting nearby objects

### Gesture triggers too easily

**Cause**: Sensor is too sensitive.

**Solutions**:
- Decrease `SENSOR_THRESHOLD` (e.g., 20cm)
- Increase `SENSOR_DETECTION_COUNT` (e.g., 5/5 = 100%)
- Increase `WAIT_TIME` (e.g., 2.0 seconds)

### Gesture requires too much precision

**Cause**: Detection window is too strict.

**Solutions**:
- Increase `SENSOR_THRESHOLD` (e.g., 40cm)
- Decrease `SENSOR_DETECTION_COUNT` (e.g., 3/5 = 60%)

## Technical Details

### Buffer Management

- Each sensor maintains a circular buffer of the last 5 readings
- Buffers are cleared when transitioning to "waiting for removal" state
- This ensures removal detection uses fresh data

### State Isolation

- Each sensor (X and Y) has independent state machines
- One sensor detecting doesn't affect the other
- Both can be in different states simultaneously

### Thread Safety

- State variables are global but modified in single-threaded loop
- No race conditions possible in current architecture
- Backend cooldown is also single-threaded

## Timing Diagram

```
Time (s)   Sensor Reading    State              Action
─────────  ───────────────   ─────────────────  ───────────────────
0.0        Distance: 45cm    IDLE               
0.2        Distance: 28cm    IDLE               
0.4        Distance: 25cm    IDLE               
0.6        Distance: 27cm    IDLE               
0.8        Distance: 29cm    IDLE → HAND_DET    "Hand detected!"
1.0        Distance: 28cm    HAND_DETECTED      
1.2        Distance: 27cm    HAND_DETECTED      
1.4        Distance: 26cm    HAND_DETECTED      
1.6        Distance: 28cm    HAND_DETECTED      
1.8        Distance: 29cm    HAND_DET → WAIT    "Waiting for removal"
                                                 Buffer cleared
2.0        Distance: 45cm    WAIT_FOR_REMOVAL   
2.2        Distance: 52cm    WAIT_FOR_REMOVAL   
2.4        Distance: 48cm    WAIT_FOR_REMOVAL   
2.6        Distance: 55cm    WAIT_FOR_REMOVAL   
2.8        Distance: 51cm    WAIT → IDLE        "Hand removed!"
                                                 Send rating
3.0        Distance: 95cm    IDLE               Ready for next gesture
```

Total gesture time: ~3 seconds

