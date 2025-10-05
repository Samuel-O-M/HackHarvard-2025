// --- Configuración de Sensores ---
const int SENSOR_COUNT = 2;
const int TRIGGER_PINS[SENSOR_COUNT] = {11, 13}; // Pines para Trig
const int ECHO_PINS[SENSOR_COUNT] = {10, 12};    // Pines para Echo

void setup() {
  Serial.begin(9600); // Inicia la comunicación serie

  for (int i = 0; i < SENSOR_COUNT; i++) {
    pinMode(TRIGGER_PINS[i], OUTPUT);
    pinMode(ECHO_PINS[i], INPUT);
  }
}

void loop() {
  // Mide la distancia de ambos sensores
  long distance1 = getDistance(TRIGGER_PINS[1], ECHO_PINS[1]);
  long distance2 = getDistance(TRIGGER_PINS[0], ECHO_PINS[0]);

  // Envía los datos en un formato claro, por ejemplo: "dist:15:120"
  Serial.print("dist:");
  Serial.print(distance1);
  Serial.print(":");
  Serial.println(distance2); // println para enviar el salto de línea

  // Espera 0.2 segundos antes de la siguiente lectura
  delay(200);
}

/**
 * @brief Mide la distancia para un sensor HC-SR04.
 * @return La distancia calculada en centímetros.
 */
long getDistance(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH);
  // Calcula la distancia en cm y se asegura de que no sea negativa
  long calculatedDistance = duration * 0.034 / 2;
  return calculatedDistance > 0 ? calculatedDistance : 0;
}
