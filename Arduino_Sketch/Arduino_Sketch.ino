int irrigationPin = 3;
float predicted_value = 0.0;

void setup() {
  Serial.begin(9600);
  pinMode(irrigationPin,OUTPUT);
  Serial.println("Arduino is ready to receive data to either Irrigate/Not to irrigate.");
}

void loop() { 

  if (Serial.available() > 0) {
        String receivedData = Serial.readStringUntil('\n'); 
        predicted_value = receivedData.toFloat();
        
        Serial.print("Received predicted value: ");
        Serial.println(predicted_value);

        if (predicted_value <=  20) {
            digitalWrite(irrigationPin, HIGH); 
            Serial.println("Irrigation in place...");
            
        } else {
            digitalWrite(irrigationPin, LOW); 
            Serial.println("No irrigation taking place.");
        }
    }
  delay(1000); 
}
