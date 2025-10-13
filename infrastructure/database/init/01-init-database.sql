-- KIRO ERP Database Initialization Script
-- This script sets up the initial database structure and configurations

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS kiro_core;
CREATE SCHEMA IF NOT EXISTS kiro_analytics;
CREATE SCHEMA IF NOT EXISTS kiro_audit;

-- Set search path
ALTER DATABASE kiro_erp_dev SET search_path TO kiro_core, public;

-- Create roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'kiro_app') THEN
        CREATE ROLE kiro_app WITH LOGIN PASSWORD 'kiro_app_password';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'kiro_readonly') THEN
        CREATE ROLE kiro_readonly WITH LOGIN PASSWORD 'kiro_readonly_password';
    END IF;
END
$$;

-- Grant permissions
GRANT CONNECT ON DATABASE kiro_erp_dev TO kiro_app;
GRANT USAGE ON SCHEMA kiro_core TO kiro_app;
GRANT CREATE ON SCHEMA kiro_core TO kiro_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA kiro_core TO kiro_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA kiro_core TO kiro_app;

GRANT CONNECT ON DATABASE kiro_erp_dev TO kiro_readonly;
GRANT USAGE ON SCHEMA kiro_core TO kiro_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA kiro_core TO kiro_readonly;

-- Create audit log function
CREATE OR REPLACE FUNCTION kiro_audit.audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO kiro_audit.audit_log (
            table_name, operation, old_data, changed_by, changed_at
        ) VALUES (
            TG_TABLE_NAME, TG_OP, row_to_json(OLD), current_user, now()
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO kiro_audit.audit_log (
            table_name, operation, old_data, new_data, changed_by, changed_at
        ) VALUES (
            TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW), current_user, now()
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO kiro_audit.audit_log (
            table_name, operation, new_data, changed_by, changed_at
        ) VALUES (
            TG_TABLE_NAME, TG_OP, row_to_json(NEW), current_user, now()
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit log table
CREATE TABLE IF NOT EXISTS kiro_audit.audit_log (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by TEXT NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON kiro_audit.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON kiro_audit.audit_log(changed_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_operation ON kiro_audit.audit_log(operation);

-- Performance optimizations
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Reload configuration
SELECT pg_reload_conf();

COMMENT ON DATABASE kiro_erp_dev IS 'KIRO ERP Development Database';