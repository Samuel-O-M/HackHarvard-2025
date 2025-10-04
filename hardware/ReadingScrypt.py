import serial
import requests
import time

Arduino_Port = 'COM6'
#URL_FLASK_API = ''

# Establish conexion con Arduino y API
try:
    arduino = serial.Serial(Arduino_Port, 9600, timeout=1)  
    time.sleep(2)  # Wait for the connection to establish
    print("Conexion established")

except serial.SerialException as e:
    print(f"Establishing conexion with Arduino failed: {e}")
    exit(1)

while True:
    try:
        Data_Output = arduino.readline()

        if Data_Output:
            Clean_Data = Data_Output.decode('utf-8').strip()
            print(f"Dato recibido de Arduino: '{Clean_Data}'")
            
            # Send data to Flask


    except Exception as e:
        print(f"\nError: {e}")
        break
arduino.close()