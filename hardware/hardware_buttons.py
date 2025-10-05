"""
Hardware Button Controller for Language Learning System
Computer B - Connects to Computer A's backend

This script reads button input from Arduino and sends it to the backend.
Buttons 1-4 map to Hard, Medium, Good, Easy ratings respectively.
Any button press also triggers "show card" action.
"""

import serial
import requests
import time
from config import BACKEND_URL, ARDUINO_PORT, BAUD_RATE

# Rating mapping: Button number -> Rating value
# Button 1 = Hard (1), Button 2 = Medium (2), Button 3 = Good (3), Button 4 = Easy (4)
BUTTON_TO_RATING = {
    1: 1,  # Hard
    2: 2,  # Medium
    3: 3,  # Good
    4: 4   # Easy
}

print("Starting Hardware Button Controller...")
print(f"Backend URL: {BACKEND_URL}")
print(f"Arduino Port: {ARDUINO_PORT}")
print(f"Button Mapping: 1=Hard, 2=Medium, 3=Good, 4=Easy")
print("-" * 50)

arduino = None

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
            elif result.get("status") == "cooldown":
                print(f"  → Cooldown active: wait {result.get('wait_time', 0):.2f}s")
            else:
                print(f"  → Backend confirmed: {action}" + (f" (rating: {rating})" if rating else ""))
            return result.get("status") == "ok"
        else:
            print(f"  → Backend error: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"  → Connection error: {e}")
        return False

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
                
                if clean_data.isdigit():
                    button_id = int(clean_data)
                    print(f"Button {button_id} pressed")
                    
                    if button_id in BUTTON_TO_RATING:
                        rating = BUTTON_TO_RATING[button_id]
                        
                        # First, trigger show card
                        send_hardware_input("show_card")
                        
                        # Small delay before sending rating
                        time.sleep(0.1)
                        
                        # Then, send the rating
                        send_hardware_input("submit_rating", rating)
                    else:
                        print(f"  → Unknown button: {button_id}")
        
        except KeyboardInterrupt:
            print("\n\nShutdown signal received. Exiting...")
            break
        except Exception as e:
            print(f"Error during loop: {e}")
            time.sleep(1)  # Wait before retrying

except serial.SerialException as e:
    print(f"✗ Failed to connect to Arduino on {ARDUINO_PORT}: {e}")
    print("Please check:")
    print("  1. Arduino is connected via USB")
    print("  2. Correct port is specified in config.py")
    print("  3. No other program is using the serial port")
except Exception as e:
    print(f"Unexpected startup error: {e}")
finally:
    if arduino and arduino.is_open:
        arduino.close()
        print("Arduino port closed.")

