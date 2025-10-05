import serial
import requests
import time

# CONFIGURATION
ARDUINO_PORT = 'COM6'
BAUD_RATE = 9600
API_ENDPOINT_URL = 'http://127.0.0.1:8000/update_distances'

arduino = None

try:
    arduino = serial.Serial(ARDUINO_PORT, BAUD_RATE, timeout=1)
    time.sleep(2)
    print(f"Conectado exitosamente al Arduino en {ARDUINO_PORT}.")

    while True:
        raw_data = arduino.readline()

        if raw_data:
            clean_data = raw_data.decode('utf-8').strip()
            print(f"Dato recibido del Arduino: '{clean_data}'")

            if clean_data.startswith("dist:"):
                try:
                    parts = clean_data.split(':')

                    # JSON Format
                    payload = {
                        "distance1": int(parts[1]),
                        "distance2": int(parts[2])
                    }

                    # Send data
                    requests.post(API_ENDPOINT_URL, json=payload)
                    print(f"Payload enviado a la API: {payload}")

                except (requests.exceptions.RequestException, IndexError, ValueError) as e:
                    print(f"Error al procesar o enviar datos a la API: {e}")
            else:
                print(f"Ignorando dato (formato no reconocido): '{clean_data}'")

except KeyboardInterrupt:
    print("\nSeñal de cierre recibida. Saliendo.")
except serial.SerialException as e:
    print(f"Fallo al conectar con el Arduino en {ARDUINO_PORT}: {e}")
finally:
    if arduino and arduino.is_open:
        arduino.close()
        print("Puerto de Arduino cerrado.")
