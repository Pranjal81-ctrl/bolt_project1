/*
  # Add vector similarity search function

  1. Functions
    - `search_tasks_by_similarity()` - performs vector similarity search on tasks
  
  2. Performance
    - Uses vector similarity with cosine distance
    - Returns top matches above threshold
*/

-- Function to search tasks by vector similarity
CREATE OR REPLACE FUNCTION search_tasks_by_similarity(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  priority text,
  status text,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.priority,
    t.status,
    t.created_at,
    1 - (t.embedding <=> query_embedding) AS similarity
  FROM tasks t
  WHERE 
    t.embedding IS NOT NULL
    AND (user_id IS NULL OR t.user_id = user_id)
    AND 1 - (t.embedding <=> query_embedding) > match_threshold
  ORDER BY t.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;