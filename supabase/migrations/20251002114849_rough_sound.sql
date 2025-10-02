/*
  # Create subtasks table

  1. New Tables
    - `subtasks`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `parent_task_id` (uuid, foreign key to tasks)
      - `priority` (text, enum: low/medium/high, default: medium)
      - `status` (text, enum: pending/in-progress/done, default: pending)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamp with timezone, default: now())
      - `updated_at` (timestamp with timezone, default: now())

  2. Security
    - Enable RLS on `subtasks` table
    - Add policy for users to manage their own subtasks
    - Add policy to ensure users can only create subtasks for their own tasks

  3. Performance
    - Add indexes on parent_task_id, user_id, and status columns
    - Add trigger to automatically update updated_at timestamp

  4. Data Integrity
    - Check constraints for priority and status enums
    - Foreign key constraints with cascade delete
*/

-- Create subtasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  parent_task_id uuid NOT NULL,
  priority text DEFAULT 'medium' NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add check constraints for priority and status if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'subtasks_priority_check'
  ) THEN
    ALTER TABLE subtasks ADD CONSTRAINT subtasks_priority_check 
    CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'subtasks_status_check'
  ) THEN
    ALTER TABLE subtasks ADD CONSTRAINT subtasks_status_check 
    CHECK (status = ANY (ARRAY['pending'::text, 'in-progress'::text, 'done'::text]));
  END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'subtasks_parent_task_id_fkey'
  ) THEN
    ALTER TABLE subtasks ADD CONSTRAINT subtasks_parent_task_id_fkey 
    FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'subtasks_user_id_fkey'
  ) THEN
    ALTER TABLE subtasks ADD CONSTRAINT subtasks_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS subtasks_parent_task_id_idx ON subtasks(parent_task_id);
CREATE INDEX IF NOT EXISTS subtasks_user_id_idx ON subtasks(user_id);
CREATE INDEX IF NOT EXISTS subtasks_status_idx ON subtasks(status);

-- Enable RLS
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can manage their own subtasks" ON subtasks;
DROP POLICY IF EXISTS "Users can only create subtasks for their own tasks" ON subtasks;

-- Create RLS policies
CREATE POLICY "Users can manage their own subtasks"
  ON subtasks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only create subtasks for their own tasks"
  ON subtasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = subtasks.parent_task_id 
      AND tasks.user_id = auth.uid()
    )
  );

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_subtasks_updated_at ON subtasks;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_subtasks_updated_at
  BEFORE UPDATE ON subtasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();