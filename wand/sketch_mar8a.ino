#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BNO055.h>

// I2C configuration for ESP32-CAM
#define SDA_PIN 14  // Custom SDA
#define SCL_PIN 15  // Custom SCL

// Joystick pins (swapped)
// New Joystick X is from analog pin GPIO 32 (originally VRY)
// New Joystick Y is from analog pin GPIO 33 (originally VRX)
#define JOY_X_PIN 32  // For X-axis (centered value)
#define JOY_Y_PIN 33  // For Y-axis (used for toggle)

Adafruit_BNO055 bno = Adafruit_BNO055(55, 0x28);

// Variables to hold orientation offset
float offsetYaw = 0, offsetPitch = 0, offsetRoll = 0;
bool offsetUpdated = false;
bool serialEnabled = true;  // Controls whether serial output is active
bool toggleLock = false;    // Prevents rapid toggling

void setup() {
  Serial.begin(115200);
  Wire.begin(SDA_PIN, SCL_PIN);
  
  // Initialize BNO055 (address 0x28, ADR tied to GND)
  if (!bno.begin()) {
    Serial.println("ERROR: BNO055 not detected. Check wiring!");
    while (1) { delay(10); }
  }
  delay(1000); // Allow sensor to settle
  bno.setExtCrystalUse(true);
}

void loop() {
  // Read joystick values:
  int rawJoyX = analogRead(JOY_X_PIN); // New joystick X
  int rawJoyY = analogRead(JOY_Y_PIN); // New joystick Y (for toggle)

  // Toggle serial output when joystick Y goes below 1500
  if (rawJoyY < 1500 && !toggleLock) {
    serialEnabled = !serialEnabled;  // Toggle the state
    toggleLock = true;  // Lock the toggle until joystick moves up again

    // Print status message once when toggled
    if (serialEnabled) {
      Serial.println("started");
    } else {
      Serial.println("stopped");
    }
  } 
  else if (rawJoyY >= 1500) {
    toggleLock = false;  // Unlock the toggle when joystick moves back up
  }

  // If serial output is disabled, skip the rest of the loop
  if (!serialEnabled) {
    return;
  }

  // Map joystick X so that center (≈2048) becomes 0:
  int centeredJoyX = (rawJoyX - 2048)/80;
  
  // Read orientation from BNO055:
  imu::Vector<3> euler = bno.getVector(Adafruit_BNO055::VECTOR_EULER);
  float yaw   = euler.x();
  float roll  = euler.y();
  float pitch = euler.z();
  
  // If joystick Y is pushed high (above 4000), update the offset once
  if (rawJoyY > 4000) {
    if (!offsetUpdated) {
      offsetYaw = yaw;
      offsetRoll = roll;
      offsetPitch = pitch;
      offsetUpdated = true;
    }
  } else {
    offsetUpdated = false;
  }
  
  // Apply the offset
  float adjYaw   = yaw - offsetYaw;
  float adjRoll  = roll - offsetRoll;
  float adjPitch = pitch - offsetPitch;
  
  // Print the output only if serial is enabled
  Serial.print("Joystick X: ");
  Serial.print(centeredJoyX);
  Serial.print(" | Roll: ");
  Serial.print(adjRoll, 2);
  Serial.print(" | Pitch: ");
  Serial.print(adjPitch, 2);
  Serial.print(" | Yaw: ");
  Serial.println(adjYaw, 2);
  
  delay(100);
}
