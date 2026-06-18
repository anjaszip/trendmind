-- TrendMind PostgreSQL Initialization
-- Enables TimescaleDB extension and creates the hypertable for trend data

CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
