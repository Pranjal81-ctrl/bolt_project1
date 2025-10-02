const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface SearchRequest {
  query: string;
  userId: string;
}

interface Task {
  id: string;
  title: string;
  priority: string;
  status: string;
  created_at: string;
  similarity: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { query, userId }: SearchRequest = await req.json();

    if (!query || !userId) {
      return new Response(
        JSON.stringify({ error: "Query and userId are required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Generate embedding for the search query using Supabase AI
    const model = new Supabase.ai.Session('gte-small');
    const queryEmbedding = await model.run(query, { mean_pool: true, normalize: true });

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, let's check if we have embeddings for tasks
    // If not, we'll generate them on the fly
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, priority, status, created_at')
      .eq('user_id', userId);

    if (tasksError) {
      throw new Error(`Failed to fetch tasks: ${tasksError.message}`);
    }

    if (!tasksData || tasksData.length === 0) {
      return new Response(
        JSON.stringify({ results: [] }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Generate embeddings for all tasks and calculate similarity
    const results: Task[] = [];
    
    for (const task of tasksData) {
      try {
        // Generate embedding for task title
        const taskEmbedding = await model.run(task.title, { mean_pool: true, normalize: true });
        
        // Calculate cosine similarity
        const similarity = calculateCosineSimilarity(queryEmbedding, taskEmbedding);
        
        if (similarity > 0.7) {
          results.push({
            ...task,
            similarity
          });
        }
      } catch (embeddingError) {
        console.error(`Error generating embedding for task ${task.id}:`, embeddingError);
        // Continue with other tasks
      }
    }

    // Sort by similarity (highest first) and take top 5
    const topResults = results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    return new Response(
      JSON.stringify({ results: topResults }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error('Error in smart-search function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to perform smart search",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

// Helper function to calculate cosine similarity between two vectors
function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}