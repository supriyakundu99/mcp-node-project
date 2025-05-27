-- Create schema if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'mcp_schema') THEN
        EXECUTE 'CREATE SCHEMA mcp_schema';
    END IF;
END$$;

-- Create table if not exists
CREATE TABLE IF NOT EXISTS mcp_schema.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data if not exists
INSERT INTO mcp_schema.users (username, email)
SELECT 'alice', 'alice@example.com'
WHERE NOT EXISTS (
    SELECT 1 FROM mcp_schema.users WHERE username = 'alice'
);

INSERT INTO mcp_schema.users (username, email)
SELECT 'bob', 'bob@example.com'
WHERE NOT EXISTS (
    SELECT 1 FROM mcp_schema.users WHERE username = 'bob'
);
commit;