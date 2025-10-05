# Configuration file for hardware connection to backend
# Edit this file to set the correct backend URL for Computer A

# Backend URL - Replace 'x' with the actual IP address of Computer A
# Example: BACKEND_URL = 'http://192.168.1.100:8000'
BACKEND_URL = 'http://x:8000'

# Arduino port - Adjust according to your system
# Windows: 'COM3', 'COM4', etc.
# Linux/Mac: '/dev/ttyUSB0', '/dev/ttyACM0', etc.
ARDUINO_PORT = 'COM6'

# Baud rate for Arduino communication
BAUD_RATE = 9600

# Sensor detection threshold (in cm)
SENSOR_THRESHOLD = 30

# Number of consecutive pulses to check for sensor detection
SENSOR_WINDOW_SIZE = 5

# Number of detections needed within the window
SENSOR_DETECTION_COUNT = 4

