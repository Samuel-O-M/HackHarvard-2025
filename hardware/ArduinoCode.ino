const int buttons[] = {2,3,4,5};
const int numButtons = 4;

int formerState[] = {LOW, LOW, LOW, LOW};
void setup() {
  Serial.begin(9600);

  //Activa los pines
  for (int i = 0; i < numButtons; i++)
    {
      pinMode(buttons[i], INPUT);
    }   
}

void loop() {
  for (int i=0; i<numButtons ;i++)
  {
    int State = digitalRead(buttons[i]);

    //Compare the state of the button so we only output a value when it changes
    if (State == HIGH && formerState[i] == LOW) // Se pone la condición de HIGH para que cuando se deje de pulsar no devuelva nada
    {
      //Returns the computer the value of the pin that has been pushed
      Serial.println(buttons[i]);
      delay(200);
    }
    formerState[i] = State;
  }
}
