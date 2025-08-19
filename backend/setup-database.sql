-- Create enum types
CREATE TYPE debt_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
CREATE TYPE debt_type AS ENUM ('debt', 'credit');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  "isAdmin" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on email
CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);

-- Create debts table
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  "dueDate" TIMESTAMP WITH TIME ZONE,
  status debt_status DEFAULT 'pending',
  type debt_type NOT NULL,
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user
    FOREIGN KEY("userId") 
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- Create indexes for debts
CREATE INDEX IF NOT EXISTS debts_user_id_idx ON debts("userId");
CREATE INDEX IF NOT EXISTS debts_status_idx ON debts(status);
CREATE INDEX IF NOT EXISTS debts_type_idx ON debts(type);

-- Create SequelizeMeta table for future migrations
CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
  "name" VARCHAR(255) NOT NULL,
  PRIMARY KEY ("name"),
  UNIQUE ("name")
);

-- Insert initial migration record
INSERT INTO "SequelizeMeta" ("name") 
VALUES ('20240819000000-create-initial-schema.js')
ON CONFLICT ("name") DO NOTHING;

-- Create a function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debts_updated_at
BEFORE UPDATE ON debts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
