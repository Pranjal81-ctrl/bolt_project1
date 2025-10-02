/*
  # Create subtasks table

  1. New Tables
    - `subtasks`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `parent_task_id` (uuid, foreign key to tasks table)
      - `priority` (text, enum: low/medium/high, default: medium)
      - `status` (text, enum: pending/in-progress/done, default: pending)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamp with timezone, default: now())
      - `updated_at` (timestamp with timezone, default: now())

  2. Security
    - Enable RLS on `subtasks` table
    - Add policy for authenticated users to manage their own subtasks
    - Users can only access subtasks for tasks they own

  3. Indexes
    - Index on parent_task_id for efficient subtask queries
    - Index on user_id for user-specific queries
    - Index on status for filtering by completion status

  4. Constraints
    - Check constraints for priority and status enums
    - Foreign key constraints to ensure data integrity
    - Cascade delete when parent task is deleted
*/

-- Create subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  parent_task_id uuid NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add check constraints for enums
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'subtasks_priority_check' 
    AND table_name = 'subtasks'
  ) THEN
    ALTER TABLE subtasks ADD CONSTRAINT subtasks_priority_check 
    CHECK (priority IN ('low', 'medium', 'high'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'subtasks_status_check' 
    AND table_name = 'subtasks'
  ) THEN
    ALTER TABLE subtasks ADD CONSTRAINT subtasks_status_check 
    CHECK (status IN ('pending', 'in-progress', 'done'));
  END IF;
END $$;

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'subtasks_parent_task_id_fkey' 
    AND table_name = 'subtasks'
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
    AND table_name = 'subtasks'
  ) THEN
    ALTER TABLE subtasks ADD CONSTRAINT subtasks_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS subtasks_parent_task_id_idx ON subtasks(parent_task_id);
CREATE INDEX IF NOT EXISTS subtasks_user_id_idx ON subtasks(user_id);
CREATE INDEX IF NOT EXISTS subtasks_status_idx ON subtasks(status);

-- Enable Row Level Security
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY IF NOT EXISTS "Users can manage their own subtasks"
  ON subtasks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Additional policy to ensure users can only create subtasks for their own tasks
CREATE POLICY IF NOT EXISTS "Users can only create subtasks for their own tasks"
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

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_subtasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_subtasks_updated_at_trigger ON subtasks;
CREATE TRIGGER update_subtasks_updated_at_trigger
  BEFORE UPDATE ON subtasks
  FOR EACH ROW
  EXECUTE FUNCTION update_subtasks_updated_at();