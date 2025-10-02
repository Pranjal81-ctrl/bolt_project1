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
  similarity?: number;
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

    // Search using vector similarity with stored embeddings
    const { data: tasksData, error: tasksError } = await supabase
      .rpc('search_tasks_by_similarity', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 5,
        user_id: userId
      });

    if (tasksError) {
      // Fallback to manual similarity calculation if RPC doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('tasks')
        .select('id, title, priority, status, created_at, embedding')
        .eq('user_id', userId)
        .not('embedding', 'is', null);

      if (fallbackError) {
        throw new Error(`Failed to fetch tasks: ${fallbackError.message}`);
      }

      if (!fallbackData || fallbackData.length === 0) {
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

      // Calculate similarity manually
      const results: (Task & { similarity: number })[] = [];
      
      for (const task of fallbackData) {
        if (task.embedding) {
          const similarity = calculateCosineSimilarity(queryEmbedding, task.embedding);
          if (similarity > 0.7) {
            results.push({
              id: task.id,
              title: task.title,
              priority: task.priority,
              status: task.status,
              created_at: task.created_at,
              similarity
            });
          }
        }
      }

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
    }

    if (!tasksData) {
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

    return new Response(
      JSON.stringify({ results: tasksData }),
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