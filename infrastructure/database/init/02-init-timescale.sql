-- TimescaleDB Initialization for KIRO ERP Analytics
-- This script sets up TimescaleDB for time-series data

-- Create TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create schemas for time-series data
CREATE SCHEMA IF NOT EXISTS kiro_metrics;
CREATE SCHEMA IF NOT EXISTS kiro_iot;
CREATE SCHEMA IF NOT EXISTS kiro_logs;

-- Performance metrics table
CREATE TABLE IF NOT EXISTS kiro_metrics.api_performance (
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER NOT NULL,
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    request_size INTEGER,
    response_size INTEGER
);

-- Convert to hypertable
SELECT create_hypertable('kiro_metrics.api_performance', 'time', if_not_exists => TRUE);

-- IoT sensor data table
CREATE TABLE IF NOT EXISTS kiro_iot.sensor_data (
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_id TEXT NOT NULL,
    sensor_type TEXT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    unit TEXT,
    location TEXT,
    metadata JSONB
);

-- Convert to hypertable
SELECT create_hypertable('kiro_iot.sensor_data', 'time', if_not_exists => TRUE);

-- Application logs table
CREATE TABLE IF NOT EXISTS kiro_logs.application_logs (
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    service TEXT NOT NULL,
    trace_id TEXT,
    span_id TEXT,
    user_id UUID,
    metadata JSONB
);

-- Convert to hypertable
SELECT create_hypertable('kiro_logs.application_logs', 'time', if_not_exists => TRUE);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_api_performance_endpoint_time ON kiro_metrics.api_performance (endpoint, time DESC);
CREATE INDEX IF NOT EXISTS idx_api_performance_status_time ON kiro_metrics.api_performance (status_code, time DESC);
CREATE INDEX IF NOT EXISTS idx_api_performance_user_time ON kiro_metrics.api_performance (user_id, time DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_data_device_time ON kiro_iot.sensor_data (device_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_data_type_time ON kiro_iot.sensor_data (sensor_type, time DESC);

CREATE INDEX IF NOT EXISTS idx_application_logs_level_time ON kiro_logs.application_logs (level, time DESC);
CREATE INDEX IF NOT EXISTS idx_application_logs_service_time ON kiro_logs.application_logs (service, time DESC);
CREATE INDEX IF NOT EXISTS idx_application_logs_trace_time ON kiro_logs.application_logs (trace_id, time DESC);

-- Create continuous aggregates for common queries
CREATE MATERIALIZED VIEW IF NOT EXISTS kiro_metrics.api_performance_hourly
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', time) AS bucket,
    endpoint,
    method,
    COUNT(*) as request_count,
    AVG(response_time_ms) as avg_response_time,
    MAX(response_time_ms) as max_response_time,
    MIN(response_time_ms) as min_response_time,
    COUNT(*) FILTER (WHERE status_code >= 400) as error_count
FROM kiro_metrics.api_performance
GROUP BY bucket, endpoint, method;

-- Add refresh policy for continuous aggregates
SELECT add_continuous_aggregate_policy('kiro_metrics.api_performance_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE);

-- Create retention policies
SELECT add_retention_policy('kiro_metrics.api_performance', INTERVAL '90 days', if_not_exists => TRUE);
SELECT add_retention_policy('kiro_iot.sensor_data', INTERVAL '1 year', if_not_exists => TRUE);
SELECT add_retention_policy('kiro_logs.application_logs', INTERVAL '30 days', if_not_exists => TRUE);

-- Create compression policies
SELECT add_compression_policy('kiro_metrics.api_performance', INTERVAL '7 days', if_not_exists => TRUE);
SELECT add_compression_policy('kiro_iot.sensor_data', INTERVAL '30 days', if_not_exists => TRUE);
SELECT add_compression_policy('kiro_logs.application_logs', INTERVAL '3 days', if_not_exists => TRUE);

COMMENT ON SCHEMA kiro_metrics IS 'Performance and application metrics';
COMMENT ON SCHEMA kiro_iot IS 'IoT sensor data and device telemetry';
COMMENT ON SCHEMA kiro_logs IS 'Application and system logs';