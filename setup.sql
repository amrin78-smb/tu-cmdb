ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

INSERT INTO users (name, email, password_hash, role)
VALUES (
  'IT Admin',
  'admin@yourcompany.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oZ9VLnTCu',
  'admin'
)
ON CONFLICT (email) DO NOTHING;
