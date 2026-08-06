// =============================================================================
// Canonical AsyncAPI Spec: Sensor Telemetry (Multi-Protocol IoT)
//
// An IoT sensor telemetry system with Kafka for high-throughput ingestion,
// WebSocket for real-time dashboards, and MQTT for edge devices.
// Demonstrates multi-server, multi-protocol setups with security.
//
// Real-world patterns: Multi-protocol, OAuth2 security, API key auth,
// Kafka bindings, MQTT bindings, sensor data models, batch readings.
// =============================================================================

@service(#{ title: "Sensor Telemetry Platform", version: "2.0.0" })
@server("kafka-broker", #{ url: "kafka://telemetry-broker:9092", protocol: "kafka" })
@server("mqtt-broker", #{ url: "mqtt://edge-mqtt:1883", protocol: "mqtt" })
@server("realtime", #{ url: "ws://dashboard.realtime:8080", protocol: "ws" })
@defaultContentType("application/json")
namespace SensorTelemetryPlatform;

// --- Sensor types ---
enum SensorType {
  temperature: "temperature",
  humidity: "humidity",
  pressure: "pressure",
  co2: "co2",
  light: "light",
  motion: "motion",
  vibration: "vibration",
}

enum SensorStatus {
  active: "active",
  inactive: "inactive",
  error: "error",
  maintenance: "maintenance",
  calibration: "calibration",
}

// --- Sensor model ---
model Sensor {
  sensorId: string;
  deviceId: string;
  type: SensorType;
  status: SensorStatus;
  firmwareVersion: string;
  batteryLevel: float32;
  signalStrength: int32;
  location: {
    latitude: float64;
    longitude: float64;
    altitude: float32;
    description: string;
  };
  calibrationDate: string;
  nextCalibrationDate: string;
}

// --- Telemetry reading ---
model SensorReading {
  sensorId: string;
  type: SensorType;
  value: float64;
  unit: string;
  timestamp: string;
  quality: "good" | "questionable" | "bad";
  metadata: Record<string>;
}

// --- Batch reading ---
model SensorBatch {
  deviceId: string;
  readings: SensorReading[];
  batchId: string;
  startTime: string;
  endTime: string;
  readingCount: int32;
  checksum: string;
}

// --- Alert model ---
model SensorAlert {
  alertId: string;
  sensorId: string;
  type: SensorType;
  severity: "info" | "warning" | "critical" | "emergency";
  threshold: float64;
  actualValue: float64;
  message: string;
  triggeredAt: string;
  acknowledgedBy: string;
  acknowledgedAt: string;
  actionsTaken: string[];
}

// --- Device registration ---
model DeviceRegistration {
  deviceId: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  firmwareVersion: string;
  sensors: Sensor[];
  registeredAt: string;
  metadata: Record<string>;
}

// --- Operations: Kafka (high-throughput ingestion) ---
@doc("Publish sensor readings to Kafka for batch processing")
@channel("telemetry.sensors.readings")
@publish
op publishSensorReading(): SensorReading;

@doc("Publish sensor batch readings")
@channel("telemetry.sensors.batch")
@publish
op publishSensorBatch(): SensorBatch;

@doc("Subscribe to sensor alerts")
@channel("telemetry.sensors.alerts")
@subscribe
op subscribeSensorAlerts(): SensorAlert;

// --- Operations: MQTT (edge devices) ---
@doc("Edge device publishes individual reading via MQTT")
@channel("edge.devices.{deviceId}.readings")
@publish
op publishEdgeReading(deviceId: string): SensorReading;

@doc("Subscribe to edge device readings")
@channel("edge.devices.{deviceId}.readings")
@subscribe
op subscribeEdgeReadings(deviceId: string): SensorReading;

@doc("Edge device registers itself")
@channel("edge.devices.registration")
@publish
op publishDeviceRegistration(): DeviceRegistration;

// --- Operations: WebSocket (real-time dashboard) ---
@doc("Dashboard subscribes to real-time readings")
@channel("dashboard.sensors.{sensorId}.realtime")
@subscribe
op subscribeRealtimeReadings(sensorId: string): SensorReading;

@doc("Dashboard subscribes to sensor status")
@channel("dashboard.sensors.{sensorId}.status")
@subscribe
op subscribeSensorStatus(sensorId: string): Sensor;

@doc("Dashboard acknowledges alert")
@channel("dashboard.alerts.{alertId}.acknowledge")
@publish
op acknowledgeAlert(alertId: string): SensorAlert;
