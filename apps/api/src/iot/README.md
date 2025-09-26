# IoT Integration Platform

This module implements a comprehensive IoT integration platform for the KIRO ERP system, providing real-time device management, data collection, predictive maintenance, and environmental monitoring capabilities.

## Features Implemented

### 1. IoT Device Management (`/devices`)

- **Device Registration**: Register and manage IoT devices with detailed specifications
- **Device Status Tracking**: Real-time status monitoring (active, inactive, maintenance, error, offline)
- **Device Configuration**: Flexible configuration management for different device types
- **Location Tracking**: GPS and address-based location tracking
- **Asset Integration**: Link devices to physical assets for comprehensive tracking

### 2. IoT Gateway (`/gateway`)

- **MQTT Gateway**: Full MQTT broker integration with automatic reconnection
- **HTTP Gateway**: RESTful API endpoints for HTTP-based devices
- **Real-time Data Processing**: Automatic sensor data processing and storage
- **Command Publishing**: Send commands to devices via MQTT or HTTP
- **Data Validation**: Comprehensive sensor data validation and error handling

### 3. Sensor Management (`/sensors`)

- **Sensor Registration**: Register sensors with calibration and specification data
- **Multi-sensor Support**: Support for temperature, humidity, pressure, vibration, and custom sensors
- **Calibration Tracking**: Track calibration dates and schedule next calibrations
- **Sensor Configuration**: Flexible sensor configuration and threshold management

### 4. Alert System (`/alerts`)

- **Real-time Alerts**: Automatic alert generation based on sensor thresholds
- **Alert Severity Levels**: Low, medium, high, and critical severity classifications
- **Alert Acknowledgment**: User acknowledgment and resolution tracking
- **Alert History**: Complete audit trail of all alerts and actions taken

### 5. Predictive Maintenance (`/predictive-maintenance`)

- **ML Model Management**: Create and manage machine learning models
- **Multiple Algorithms**: Support for Random Forest, Neural Networks, Linear Regression, etc.
- **Model Training**: Automated model training with historical data
- **Failure Prediction**: Predict equipment failaining useful life
- **Maintenance Recommendations**: AI-powered maintenance scheduling recommendations
- **Cost Estimation**: Estimate maintenance costs and ROI analysis

### 6. Environmental Monitoring (`/environmental`)

- **Air Quality Monitoring**: Track temperature, humidity, air quality, and pollutants
- **Location-based Tracking**: Monitor environmental conditions by location
- **Regulatory Compliance**: Track compliance with environmental regulations
- **Quality Indexing**: Calculate environmental quality scores and trends

### 7. Energy Monitoring (`/energy`)

- **Smart Meter Integration**: Connect with electricity, gas, and water meters
- **Consumption Tracking**: Real-time energy consumption monitoring
- **Cost Analysis**: Track energy costs and tariff rates
- **Carbon Footprint**: Calculate and track carbon emissions
- **Peak Hour Detection**: Identify peak usage periods for optimization

### 8. Analytics & Reporting (`/analytics`)

- **Device Analytics**: Comprehensive device performance analytics
- **OEE Calculations**: Overall Equipment Effectiveness calculations
- **Real-time Dashboards**: Live monitoring dashboards with key metrics
- **Historical Analysis**: Trend analysis and historical data visualization
- **Company Overview**: High-level IoT metrics and KPIs

## Database Schema

### Core Tables

- `iot_devices`: Device registry with specifications and status
- `iot_sensors`: Sensor definitions and configurations
- `iot_sensor_data`: Time-series sensor readings (TimescaleDB hypertable)
- `equipment_metrics`: Equipment performance metrics (TimescaleDB hypertable)
- `iot_alerts`: Alert management and tracking
- `iot_gateways`: Gateway configuration and status

### Predictive Maintenance

- `predictive_maintenance_models`: ML model definitions and metadata
- `predictive_maintenance_predictions`: Prediction results and history

### Environmental & Energy

- `environmental_monitoring`: Environmental sensor data
- `energy_consumption`: Energy usage tracking and analysis

## API Endpoints

### Device Management

- `GET /iot/devices` - List all devices with filtering
- `POST /iot/devices` - Register new device
- `GET /iot/devices/:id` - Get device details
- `PATCH /iot/devices/:id` - Update device
- `DELETE /iot/devices/:id` - Remove device
- `GET /iot/devices/stats` - Device statistics

### Gateway Operations

- `GET /iot/gateway/status` - Gateway connection status
- `POST /iot/gateway/sensor-data` - Receive sensor data via HTTP
- `POST /iot/gateway/sensor-data/bulk` - Bulk sensor data ingestion
- `POST /iot/gateway/equipment-metrics` - Equipment metrics ingestion
- `GET /iot/gateway/devices/:deviceId/status` - Device status
- `POST /iot/gateway/devices/:deviceId/commands` - Send device commands

### Predictive Maintenance

- `POST /iot/predictive-maintenance/models` - Create ML model
- `GET /iot/predictive-maintenance/models` - List models
- `POST /iot/predictive-maintenance/models/:id/train` - Train model
- `POST /iot/predictive-maintenance/models/:id/predict` - Make prediction
- `GET /iot/predictive-maintenance/assets/:assetId/recommendations` - Get maintenance recommendations

### Analytics

- `GET /iot/analytics/device/:deviceId` - Device analytics
- `GET /iot/analytics/equipment/:equipmentId/efficiency` - Equipment efficiency (OEE)
- `GET /iot/analytics/overview` - Company IoT overview

## MQTT Integration

### Topics Structure

- `kiro/sensors/+/data` - Sensor data ingestion
- `kiro/equipment/+/metrics` - Equipment metrics
- `kiro/devices/+/status` - Device status updates
- `kiro/devices/+/commands` - Device command distribution

### Message Format

```json
{
  "deviceId": "device-001",
  "sensorType": "temperature",
  "measurementType": "ambient",
  "value": 23.5,
  "unit": "°C",
  "timestamp": "2024-01-15T10:30:00Z",
  "companyId": "company-uuid",
  "metadata": {
    "location": "Building A, Floor 2",
    "calibrated": true
  }
}
```

## Machine Learning Features

### Supported Algorithms

- **Random Forest**: For classification and regression tasks
- **Neural Networks**: Deep learning for complex pattern recognition
- **Linear Regression**: Simple predictive modeling
- **Isolation Forest**: Anomaly detection
- **LSTM**: Time series forecasting (planned)

### Model Types

- **Classification**: Failure/no-failure prediction
- **Regression**: Remaining useful life estimation
- **Anomaly Detection**: Unusual behavior identification
- **Time Series**: Trend forecasting

## Configuration

### Environment Variables

```env
# MQTT Configuration
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=kiro_gateway
MQTT_PASSWORD=secure_password
MQTT_CLIENT_ID=kiro-erp-gateway

# ML Models Storage
ML_MODELS_PATH=./ml-models

# TimescaleDB
TIMESCALE_URL=postgresql://user:pass@localhost:5432/kiro_timeseries
```

### MQTT Broker Setup

The system supports any MQTT 3.1.1 or 5.0 compatible broker:

- **Eclipse Mosquitto** (recommended for development)
- **AWS IoT Core** (for cloud deployments)
- **Azure IoT Hub** (for Azure deployments)
- **Google Cloud IoT Core** (for GCP deployments)

## Security Features

### Authentication & Authorization

- JWT-based API authentication
- Role-based access control (RBAC)
- Device-specific API keys for sensor data ingestion
- MQTT authentication with username/password or certificates

### Data Security

- Encrypted MQTT connections (TLS/SSL)
- API rate limiting and throttling
- Input validation and sanitization
- Audit logging for all operations

## Performance Optimizations

### TimescaleDB Integration

- Automatic data partitioning by time
- Continuous aggregates for common queries
- Data retention policies (2 years for sensor data)
- Optimized indexes for time-series queries

### Caching Strategy

- Redis caching for frequently accessed device data
- In-memory caching for real-time metrics
- Connection pooling for database operations

## Monitoring & Observability

### Logging

- Structured logging with Winston
- Correlation IDs for request tracing
- Error tracking and alerting
- Performance metrics collection

### Health Checks

- MQTT connection monitoring
- Database connectivity checks
- ML model availability verification
- Gateway status reporting

## Future Enhancements

### Planned Features

- **Edge Computing**: Local processing capabilities
- **Advanced ML**: AutoML and model optimization
- **Digital Twins**: Virtual asset representations
- **Blockchain Integration**: Immutable audit trails
- **5G/LoRaWAN Support**: Additional connectivity options

### Scalability Improvements

- Horizontal scaling with microservices
- Event-driven architecture with message queues
- Distributed ML model serving
- Multi-region deployment support

## Getting Started

1. **Install Dependencies**

   ```bash
   npm install mqtt @types/mqtt
   ```

2. **Configure Environment**

   ```bash
   cp .env.example .env
   # Edit .env with your MQTT broker and database settings
   ```

3. **Start MQTT Broker** (for development)

   ```bash
   docker run -it -p 1883:1883 eclipse-mosquitto
   ```

4. **Run Database Migrations**

   ```bash
   npm run db:migrate
   ```

5. **Start the API Server**

   ```bash
   npm run dev
   ```

6. **Test MQTT Connection**
   ```bash
   # Publish test sensor data
   mosquitto_pub -h localhost -t "kiro/sensors/test-device/data" -m '{"deviceId":"test-device","sensorType":"temperature","measurementType":"ambient","value":23.5,"unit":"°C","companyId":"test-company"}'
   ```

## API Documentation

Full API documentation is available via Swagger UI at `/api/docs` when the server is running in development mode.

## Support

For technical support and questions:

- Check the API logs for error details
- Verify MQTT broker connectivity
- Ensure TimescaleDB is properly configured
- Review device registration and sensor configuration

## License

This IoT integration platform is part of the KIRO ERP system and follows the same licensing terms.
