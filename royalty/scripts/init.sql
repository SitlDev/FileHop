#!/bin/bash

# Database initialization script for PostgreSQL
# This is run automatically by Docker when the container starts
# Only executes if the database doesn't already exist

# Enable strict error handling
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Initializing PostgreSQL Database...${NC}"

# Create extensions
echo "Creating PostgreSQL extensions..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- UUID generation
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Case-insensitive search
    CREATE EXTENSION IF NOT EXISTS "citext";
    
    -- JSON operations
    CREATE EXTENSION IF NOT EXISTS "jsonb";
    
    -- Better indexing
    CREATE EXTENSION IF NOT EXISTS "btree_gin";
    CREATE EXTENSION IF NOT EXISTS "btree_gist";
    
    -- Full-text search
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
EOSQL

echo -e "${GREEN}✓ Extensions created${NC}"

# Create schemas
echo "Creating database schemas..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Public schema is default
    -- You can add custom schemas here as needed
    
    -- Create application schema
    CREATE SCHEMA IF NOT EXISTS app AUTHORIZATION "$POSTGRES_USER";
    GRANT USAGE ON SCHEMA app TO "$POSTGRES_USER";
    ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT ALL ON TABLES TO "$POSTGRES_USER";
    ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT ALL ON SEQUENCES TO "$POSTGRES_USER";
EOSQL

echo -e "${GREEN}✓ Schemas created${NC}"

# Create roles and permissions
echo "Setting up database roles and permissions..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Application role (for connection pooling)
    DO \$\$ BEGIN
        CREATE ROLE app_user WITH LOGIN PASSWORD 'generate-secure-password';
        EXCEPTION WHEN DUPLICATE_OBJECT THEN
            RAISE NOTICE 'Role app_user already exists';
    END \$\$;
    
    -- Grant permissions
    GRANT CONNECT ON DATABASE "$POSTGRES_DB" TO app_user;
    GRANT USAGE ON SCHEMA public TO app_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO app_user;
EOSQL

echo -e "${GREEN}✓ Roles and permissions configured${NC}"

# Create useful functions
echo "Creating database functions..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Function to get database size
    CREATE OR REPLACE FUNCTION get_db_size()
    RETURNS TABLE(database_name text, size_mb numeric) AS \$\$
    SELECT
        datname,
        round(pg_database_size(datname)/1024.0/1024.0, 2)
    FROM pg_database
    WHERE datname = current_database();
    \$\$ LANGUAGE SQL;
    
    -- Function to get table sizes
    CREATE OR REPLACE FUNCTION get_table_sizes()
    RETURNS TABLE(table_name text, size_mb numeric) AS \$\$
    SELECT
        schemaname || '.' || tablename,
        round(pg_total_relation_size(schemaname||'.'||tablename)/1024.0/1024.0, 2)
    FROM pg_tables
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    \$\$ LANGUAGE SQL;
    
    -- Function to count tables
    CREATE OR REPLACE FUNCTION count_tables()
    RETURNS integer AS \$\$
    SELECT count(*)::integer FROM pg_tables
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema');
    \$\$ LANGUAGE SQL;
EOSQL

echo -e "${GREEN}✓ Database functions created${NC}"

# Set configuration for performance
echo "Optimizing PostgreSQL configuration..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Log slow queries (> 1 second)
    ALTER DATABASE "$POSTGRES_DB" SET log_min_duration_statement = 1000;
    
    -- Enable query logging
    ALTER DATABASE "$POSTGRES_DB" SET log_statement = 'all';
    
    -- Statement timeout for safety (30 minutes)
    ALTER DATABASE "$POSTGRES_DB" SET statement_timeout = '30min';
EOSQL

echo -e "${GREEN}✓ PostgreSQL optimized${NC}"

# Verify setup
echo ""
echo "Verifying database setup..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT
        'Database:' as check_type,
        current_database() as value
    UNION ALL
    SELECT
        'Connected as:',
        current_user
    UNION ALL
    SELECT
        'Extensions loaded:',
        COUNT(*)::text
    FROM pg_extension
    UNION ALL
    SELECT
        'Tables created:',
        count_tables()::text;
EOSQL

echo ""
echo -e "${GREEN}✅ Database initialization complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Run Prisma migrations: docker-compose exec app pnpm run migrate:prod"
echo "2. Verify tables: docker-compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c '\\dt'"
echo "3. Start syncing data from DSPs"
