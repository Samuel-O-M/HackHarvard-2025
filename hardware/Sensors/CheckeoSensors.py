import serial
import requests
import time

# --- CONFIGURATION ---
ARDUINO_PORT = 'COM6'  # Asegúrate de que este es el puerto correcto
BAUD_RATE = 9600
# Apuntamos a un nuevo endpoint en nuestra API
API_ENDPOINT_URL = 'http://127.0.0.1:8000/update_distances'
# ---

print("Iniciando script de lectura de sensores Arduino...")
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

            # Verificamos si el dato empieza con "dist:"
            if clean_data.startswith("dist:"):
                try:
                    # Dividimos el string: "dist:15:120" -> ["dist", "15", "120"]
                    parts = clean_data.split(':')
                    
                    # Creamos el payload en formato JSON
                    payload = {
                        "distance1": int(parts[1]),
                        "distance2": int(parts[2])
                    }

                    # Enviamos los datos a FastAPI
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
