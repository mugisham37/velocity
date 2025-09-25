-- Initialize TimescaleDB extension for IoT and analytics data
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create IoT data table for sensor readings
CREATE TABLE IF NOT EXISTS iot_sensor_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL,
    sensor_type VARCHAR(50) NOT NULL,
    measurement_type VARCHAR(50) NOT NULL,
    value DECIMAL(15, 4) NOT NULL,
    unit VARCHAR(20),
    location JSONB,
    metadata JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    company_id UUID NOT NULL
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('iot_sensor_data', 'timestamp', if_not_exists => TRUE);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_iot_device_id ON iot_sensor_data (device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_iot_sensor_type ON iot_sensor_data (sensor_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_iot_company_id ON iot_sensor_data (company_id, timestamp DESC);

-- Create equipment monitoring table
CREATE TABLE IF NOT EXISTS equipment_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    equipment_id VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15, 4) NOT NULL,
    unit VARCHAR(20),
    status VARCHAR(20) DEFAULT 'normal',
    alert_threshold DECIMAL(15, 4),
    metadata JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    company_id UUID NOT NULL
);

-- Convert to hypertable
SELECT create_hypertable('equipment_metrics', 'timestamp', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_equipment_id ON equipment_metrics (equipment_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_equipment_metric ON equipment_metrics (metric_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_equipment_company_id ON equipment_metrics (company_id, timestamp DESC);

-- Create analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    user_id UUID,
    session_id VARCHAR(100),
    properties JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    company_id UUID NOT NULL
);

-- Convert to hypertable
SELECT create_hypertable('analytics_events', 'timestamp', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events (event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_company_id ON analytics_events (company_id, timestamp DESC);

-- Create retention policies (keep data for 2 years by default)
SELECT add_retention_policy('iot_sensor_data', INTERVAL '2 years', if_not_exists => TRUE);
SELECT add_retention_policy('equipment_metrics', INTERVAL '2 years', if_not_exists => TRUE);
SELECT add_retention_policy('analytics_events', INTERVAL '1 year', if_not_exists => TRUE);

-- Create continuous aggregates for common queries
CREATE MATERIALIZED VIEW IF NOT EXISTS iot_sensor_data_hourly
WITH (timescaledb.continuous) AS
SELECT 
    device_id,
    sensor_type,
    measurement_type,
    time_bucket('1 hour', timestamp) AS bucket,
    AVG(value) AS avg_value,
    MIN(value) AS min_value,
    MAX(value) AS max_value,
    COUNT(*) AS reading_count,
    company_id
FROM iot_sensor_data
GROUP BY device_id, sensor_type, measurement_type, bucket, company_id;

-- Add refresh policy for continuous aggregate
SELECT add_continuous_aggregate_policy('iot_sensor_data_hourly',
    start_offset => INTERVAL '1 day',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE);

-- Create equipment metrics hourly aggregate
CREATE MATERIALIZED VIEW IF NOT EXISTS equipment_metrics_hourly
WITH (timescaledb.continuous) AS
SELECT 
    equipment_id,
    metric_name,
    time_bucket('1 hour', timestamp) AS bucket,
    AVG(metric_value) AS avg_value,
    MIN(metric_value) AS min_value,
    MAX(metric_value) AS max_value,
    COUNT(*) AS metric_count,
    company_id
FROM equipment_metrics
GROUP BY equipment_id, metric_name, bucket, company_id;

-- Add refresh policy
SELECT add_continuous_aggregate_policy('equipment_metrics_hourly',
    start_offset => INTERVAL '1 day',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE);