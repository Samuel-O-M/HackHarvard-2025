"""
Hardware Sensor Controller for Language Learning System
Computer B - Connects to Computer A's backend

This script reads distance sensor data from Arduino and sends it to the backend.
- Sensor X (distance1): <30cm for 4/5 consecutive pulses → Hard rating
- Sensor Y (distance2): <30cm for 4/5 consecutive pulses → Good rating
Both sensors trigger "show card" action when detected.
"""

import serial
import requests
import time
from collections import deque
from config import (
    BACKEND_URL, 
    ARDUINO_PORT, 
    BAUD_RATE,
    SENSOR_THRESHOLD,
    SENSOR_WINDOW_SIZE,
    SENSOR_DETECTION_COUNT
)

print("Starting Hardware Sensor Controller...")
print(f"Backend URL: {BACKEND_URL}")
print(f"Arduino Port: {ARDUINO_PORT}")
print(f"Detection: {SENSOR_DETECTION_COUNT}/{SENSOR_WINDOW_SIZE} pulses < {SENSOR_THRESHOLD}cm")
print(f"Sensor X → Hard, Sensor Y → Good")
print("-" * 50)

arduino = None

# Circular buffers to track last N readings for each sensor
sensor_x_buffer = deque(maxlen=SENSOR_WINDOW_SIZE)
sensor_y_buffer = deque(maxlen=SENSOR_WINDOW_SIZE)

# Cooldown to prevent repeated triggers (in seconds)
COOLDOWN_TIME = 2.0
last_trigger_x = 0
last_trigger_y = 0

def send_hardware_input(action, rating=None):
    """Send hardware input to backend"""
    try:
        payload = {"action": action}
        if rating is not None:
            payload["rating"] = rating
        
        response = requests.post(
            f"{BACKEND_URL}/hardware/input",
            json=payload,
            timeout=2
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("status") == "ignored":
                print(f"  → Action ignored: {result.get('reason')}")
            else:
                print(f"  → Backend confirmed: {action}" + (f" (rating: {rating})" if rating else ""))
            return True
        else:
            print(f"  → Backend error: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"  → Connection error: {e}")
        return False

def check_detection(buffer):
    """Check if sensor has detected object based on threshold"""
    if len(buffer) < SENSOR_WINDOW_SIZE:
        return False
    
    # Count how many readings are below threshold
    detections = sum(1 for distance in buffer if distance < SENSOR_THRESHOLD)
    return detections >= SENSOR_DETECTION_COUNT

def process_sensor_data(distance_x, distance_y):
    """Process sensor readings and trigger actions if needed"""
    global last_trigger_x, last_trigger_y
    
    current_time = time.time()
    
    # Add readings to buffers
    sensor_x_buffer.append(distance_x)
    sensor_y_buffer.append(distance_y)
    
    # Check Sensor X (Hard rating)
    if check_detection(sensor_x_buffer):
        if current_time - last_trigger_x > COOLDOWN_TIME:
            print(f"\n🔴 Sensor X detected! ({SENSOR_DETECTION_COUNT}/{SENSOR_WINDOW_SIZE} < {SENSOR_THRESHOLD}cm)")
            send_hardware_input("show_card")
            time.sleep(0.1)
            send_hardware_input("submit_rating", 1)  # Hard
            last_trigger_x = current_time
            print()
    
    # Check Sensor Y (Good rating)
    if check_detection(sensor_y_buffer):
        if current_time - last_trigger_y > COOLDOWN_TIME:
            print(f"\n🟢 Sensor Y detected! ({SENSOR_DETECTION_COUNT}/{SENSOR_WINDOW_SIZE} < {SENSOR_THRESHOLD}cm)")
            send_hardware_input("show_card")
            time.sleep(0.1)
            send_hardware_input("submit_rating", 3)  # Good
            last_trigger_y = current_time
            print()

try:
    # Establish Arduino connection
    arduino = serial.Serial(ARDUINO_PORT, BAUD_RATE, timeout=1)
    time.sleep(2)
    print(f"✓ Successfully connected to Arduino on {ARDUINO_PORT}\n")
    
    while True:
        try:
            raw_data = arduino.readline()
            
            if raw_data:
                clean_data = raw_data.decode('utf-8').strip()
                
                # Expected format: "dist:X:Y" where X and Y are distances in cm
                if clean_data.startswith("dist:"):
                    try:
                        parts = clean_data.split(':')
                        distance_x = int(parts[1])  # Sensor X
                        distance_y = int(parts[2])  # Sensor Y
                        
                        # Display current readings (with simple bar visualization)
                        x_bar = '█' * min(distance_x // 5, 20)
                        y_bar = '█' * min(distance_y // 5, 20)
                        print(f"\rSensor X: {distance_x:3d}cm {x_bar:<20} | Sensor Y: {distance_y:3d}cm {y_bar:<20}", end='', flush=True)
                        
                        # Process the sensor data
                        process_sensor_data(distance_x, distance_y)
                        
                    except (IndexError, ValueError) as e:
                        print(f"\n  → Error parsing data: {e}")
                else:
                    print(f"Ignoring data (unexpected format): '{clean_data}'")
        
        except KeyboardInterrupt:
            print("\n\nShutdown signal received. Exiting...")
            break
        except Exception as e:
            print(f"\nError during loop: {e}")
            time.sleep(1)  # Wait before retrying

except serial.SerialException as e:
    print(f"✗ Failed to connect to Arduino on {ARDUINO_PORT}: {e}")
    print("Please check:")
    print("  1. Arduino is connected via USB")
    print("  2. Correct port is specified in config.py")
    print("  3. No other program is using the serial port")
    print("  4. The correct Arduino sketch (SetUpSensors.ino) is uploaded")
except Exception as e:
    print(f"Unexpected startup error: {e}")
finally:
    if arduino and arduino.is_open:
        arduino.close()
        print("Arduino port closed.")

