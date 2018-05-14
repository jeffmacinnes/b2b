/*
Listen for incoming signals on the serial port. Whenever a signal is received
turn on the buildin LED for 1000ms
*/

void setup() {
  // set up listening on the serial port
  Serial.begin(9600); // baudrate

  // initialize digital pin LED_BUILTIN as an output.
  pinMode(LED_BUILTIN, OUTPUT);
}


void loop() {
  // whenever a message is received on the serial port, turn on the built in LED
  if (Serial.available()){
      digitalWrite(LED_BUILTIN, HIGH);   // turn the LED on (HIGH is the voltage level)
      char inByte = Serial.read(); // read the incoming data
      Serial.println(inByte); // send the data back in a new line so that it is not all one long line
      delay(100);
      digitalWrite(LED_BUILTIN, LOW);    // turn the LED off by making the voltage LOW
  }

}
