const int SENSOR_COUNT = 2;
const int TRIGGER_PINS[SENSOR_COUNT] = {11, 13}; 
const int ECHO_PINS[SENSOR_COUNT] = {10, 12}; 

void setup() {
  Serial.begin(9600); 

  for (int i = 0; i < SENSOR_COUNT; i++) {
    pinMode(TRIGGER_PINS[i], OUTPUT);
    pinMode(ECHO_PINS[i], INPUT);
  }
}

void loop() {
  long distance1 = getDistance(TRIGGER_PINS[1], ECHO_PINS[1]);
  long distance2 = getDistance(TRIGGER_PINS[0], ECHO_PINS[0]);

  Serial.print("dist:");
  Serial.print(distance1);
  Serial.print(":");
  Serial.println(distance2); 

  delay(200);
}

long getDistance(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH);
  long calculatedDistance = duration * 0.034 / 2;
  return calculatedDistance > 0 ? calculatedDistance : 0;
}
