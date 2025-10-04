import serial
import requests
import time

# CONFIGURATION
ARDUINO_PORT = 'COM6' 
BAUD_RATE = 9600
API_ENDPOINT_URL = 'http://127.0.0.1:8000/button_press'
#

print("Starting Arduino reading script...")
arduino = None # Initialize arduino variable to None

try:
    #Establish connection
    arduino = serial.Serial(ARDUINO_PORT, BAUD_RATE, timeout=1)  
    time.sleep(2)  
    print(f"Successfully connected to Arduino on {ARDUINO_PORT}.")

    while True:
        try:
            raw_data = arduino.readline()

            if raw_data:
                clean_data = raw_data.decode('utf-8').strip()
                print(f"Data received from Arduino: '{clean_data}'")
                
                if clean_data.isdigit():
                    button_id = int(clean_data) 

                    # Change to JSON format.
                    payload = {
                        "input_type": "button",
                        "input_id": button_id,
                        "value": 1 
                    }
                    
                    # Send data to FastAPI
                    try:
                        requests.post(API_ENDPOINT_URL, json=payload)
                        print(f"Payload sent to API: {payload}")
                    except requests.exceptions.RequestException as e:
                        print(f"Error connecting to the API server: {e}")                
                else:
                    print(f"Ignoring data (not a digit): '{clean_data}'")

        except KeyboardInterrupt:
            print("\nShutdown signal received. Exiting.")
            break
        except Exception as e:
            print(f"\nAn unexpected error occurred during the loop: {e}")
            break

except serial.SerialException as e:
    print(f"Failed to connect to Arduino on {ARDUINO_PORT}: {e}")
except Exception as e:
    print(f"An unexpected startup error occurred: {e}")
finally:
    # Closing port
    if arduino and arduino.is_open:
        arduino.close()
        print("Arduino port closed.")
