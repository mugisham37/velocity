-- PostgreSQL Replication Setup Script
-- This script creates the replication user and configures streaming replication

-- Create replication user
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'replicator') THEN
        CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'replication_password';
    END IF;
END
$$;

-- Grant necessary permissions
GRANT CONNECT ON DATABASE kiro_erp TO replicator;

-- Configure replication settings
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET max_wal_senders = 10;
ALTER SYSTEM SET max_replication_slots = 10;
ALTER SYSTEM SET hot_standby = on;
ALTER SYSTEM SET hot_standby_feedback = on;

-- Reload configuration
SELECT pg_reload_conf();

-- Create replication slot for each replica
SELECT pg_create_physical_replication_slot('replica_1_slot') WHERE NOT EXISTS (
    SELECT 1 FROM pg_replication_slots WHERE slot_name = 'replica_1_slot'
);

SELECT pg_create_physical_replication_slot('replica_2_slot') WHERE NOT EXISTS (
    SELECT 1 FROM pg_replication_slots WHERE slot_name = 'replica_2_slot'
);

-- Log replication setup
DO $$
BEGIN
    RAISE NOTICE 'PostgreSQL replication setup completed successfully';
    RAISE NOTICE 'Replication user: replicator';
    RAISE NOTICE 'Replication slots created: replica_1_slot, replica_2_slot';
END
$$;