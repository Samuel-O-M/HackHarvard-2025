# Hardware System Changes Summary

## Changes Made

### 1. Backend Cooldown System (`backend/main.py`)

#### What Changed
- Added 1-second cooldown between hardware inputs
- Tracks timestamp of last successful rating submission
- Rejects new inputs during cooldown period

#### Implementation
```python
# New global variables
last_hardware_input_time = 0
HARDWARE_COOLDOWN = 1.0  # seconds

# Modified /hardware/input endpoint
- Checks time since last input
- Returns {"status": "cooldown"} if too soon
- Updates timestamp only when rating is submitted
```

#### Why
- Prevents rapid-fire card reviews
- Ensures user has time to see each card
- Maintains system stability
- Creates realistic study pace

### 2. Sensor Hand Removal Detection (`hardware/hardware_sensors.py`)

#### What Changed
Complete redesign of sensor detection logic:

**OLD BEHAVIOR:**
- Detect hand near sensor (4/5 readings < 30cm)
- Immediately send rating
- 2-second cooldown before next detection

**NEW BEHAVIOR:**
- **Step 1**: Detect hand present (4/5 readings < 30cm) → ~1 second
- **Step 2**: Wait 1 second (deliberate gesture confirmation)
- **Step 3**: Detect hand removed (4/5 readings > 30cm) → ~1 second
- **Step 4**: Send rating
- Backend enforces additional 1-second cooldown

#### Implementation
```python
# State machine for each sensor
States: 'idle', 'hand_detected', 'waiting_for_removal'

# New functions
check_hand_present()  # Detects hand < threshold
check_hand_removed()  # Detects hand > threshold

# Process flow
1. idle → hand_detected (when hand present)
2. hand_detected → waiting_for_removal (after 1 sec)
3. waiting_for_removal → idle (when hand removed + send rating)
```

#### Why
- Prevents accidental triggers from brief hand movements
- Requires deliberate gesture (place and remove)
- Mimics real button press/release behavior
- More reliable detection in real-world conditions

### 3. Enhanced Feedback (`hardware_buttons.py` & `hardware_sensors.py`)

#### What Changed
Both scripts now handle cooldown status from backend:

```python
if result.get("status") == "cooldown":
    print(f"  → Cooldown active: wait {result.get('wait_time', 0):.2f}s")
```

#### Why
- Clear user feedback when cooldown is active
- Helps users understand timing requirements
- Better debugging experience

## Timing Comparison

### Buttons
**Before**: Instant (button press → rating)
**After**: Instant + 1 second cooldown before next input

### Sensors
**Before**: 
- 1 second detection
- Immediate action
- 2 second cooldown
- **Total**: 3 seconds between gestures

**After**:
- 1 second hand detection
- 1 second wait
- 1 second hand removal detection
- 1 second cooldown (backend)
- **Total**: 4 seconds between gestures

## User Experience Impact

### Positive Changes
1. **More Deliberate Interaction**: Prevents accidental triggers
2. **Better Feedback**: Clear state messages for sensors
3. **System Stability**: Cooldown prevents overwhelming the backend
4. **Natural Gestures**: Hand placement and removal feels intuitive

### Considerations
1. **Slightly Slower**: Sensors now take ~3 seconds per gesture (vs ~1 second)
2. **Learning Curve**: Users must understand the 3-step process
3. **Patience Required**: Must wait for cooldown between gestures

## Configuration Options

Users can adjust timing in `config.py` and source files:

### Sensor Sensitivity
```python
# config.py
SENSOR_THRESHOLD = 30  # Lower = must be closer
SENSOR_DETECTION_COUNT = 4  # Higher = more strict
SENSOR_WINDOW_SIZE = 5  # Larger = more data
```

### Timing
```python
# hardware_sensors.py
WAIT_TIME = 1.0  # Seconds between detect and removal check

# backend/main.py
HARDWARE_COOLDOWN = 1.0  # Seconds between accepted inputs
```

## Testing Recommendations

### Test 1: Basic Sensor Gesture
1. Place hand near Sensor X (<30cm)
2. Hold for 1 second → See "Hand detected!"
3. Wait for "Waiting for hand removal..."
4. Remove hand (>30cm)
5. See "Hand removed! Sending Hard rating..."
6. Verify card shows answer and rating is submitted

### Test 2: Cooldown Enforcement
1. Complete a sensor gesture (3 seconds)
2. Immediately try another gesture
3. Should see "Cooldown active: wait X.XXs"
4. Wait for cooldown to expire
5. Try gesture again → Should succeed

### Test 3: Button Cooldown
1. Press button 1 → Rating submitted
2. Immediately press button 2
3. Should see "Cooldown active: wait X.XXs"
4. Wait 1 second
5. Press button 2 → Should succeed

### Test 4: Accidental Hand Movement
1. Briefly wave hand near sensor (<0.5 seconds)
2. Should NOT trigger action
3. System should remain in idle or return to idle
4. This proves accidental triggers are prevented

## Files Modified

### Backend
- `backend/main.py`
  - Added `time` import
  - Added `HARDWARE_COOLDOWN` constant
  - Added `last_hardware_input_time` global variable
  - Modified `/hardware/input` endpoint to check cooldown

### Hardware Scripts
- `hardware/hardware_sensors.py`
  - Complete redesign of detection logic
  - Added state machine (idle → hand_detected → waiting_for_removal)
  - Added `check_hand_present()` and `check_hand_removed()` functions
  - Modified `process_sensor_data()` with new state flow
  - Enhanced `send_hardware_input()` to handle cooldown status

- `hardware/hardware_buttons.py`
  - Enhanced `send_hardware_input()` to handle cooldown status

### Documentation
- `hardware/README.md` - Updated sensor behavior description
- `hardware/QUICK_START.md` - Updated sensor usage instructions
- `hardware/SENSOR_BEHAVIOR.md` - NEW: Detailed technical documentation
- `HARDWARE_CHANGES_SUMMARY.md` - NEW: This file

## Migration Notes

### For Existing Users

If you were using the old sensor system:

1. **Pull latest code** from repository
2. **No configuration changes needed** - same settings work
3. **Learn new gesture**: Place → Wait → Remove
4. **Expect slower pace**: ~4 seconds between gestures (vs ~3 seconds)

### No Changes Required For

- Arduino sketches (unchanged)
- Frontend code (unchanged)
- Button hardware (behavior same, just added cooldown)
- Network setup (unchanged)

## Rollback Instructions

If you need to revert to the old behavior:

### Backend
Remove cooldown check in `main.py` line ~353-357

### Sensors
Revert `hardware_sensors.py` to commit before these changes, or:
1. Change `process_sensor_data()` to use old simple detection
2. Remove state machine variables
3. Re-add simple 2-second cooldown

## Future Improvements

Potential enhancements:

1. **Configurable cooldown**: Make `HARDWARE_COOLDOWN` editable in config.py
2. **Visual feedback**: LED indicators on Arduino for detection states
3. **Audio feedback**: Beep on detection/removal
4. **Adaptive timing**: Adjust wait times based on user patterns
5. **Gesture customization**: Allow different gesture patterns
6. **Multiple sensors**: Support 3+ sensors for more rating options

## Questions?

See detailed documentation:
- `hardware/SENSOR_BEHAVIOR.md` - Detection logic deep dive
- `hardware/README.md` - Complete hardware setup guide
- `hardware/QUICK_START.md` - Quick reference

