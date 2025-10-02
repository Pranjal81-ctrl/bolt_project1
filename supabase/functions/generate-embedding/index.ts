const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface EmbeddingRequest {
  text: string;
}

// Timeout wrapper for async operations
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  console.log('🔄 Generate embedding function called');
  console.log('📝 Request method:', req.method);

  try {
    // Add timeout to request parsing
    const requestBody = await withTimeout(req.text(), 5000);
    console.log('📦 Raw request body:', requestBody);
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(requestBody);
    } catch (parseError) {
      console.error('❌ Failed to parse request body as JSON:', parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    const { text }: EmbeddingRequest = parsedBody;
    console.log('📝 Extracted text:', text);

    if (!text || typeof text !== 'string') {
      console.error('❌ Invalid text parameter:', { text, type: typeof text });
      return new Response(
        JSON.stringify({ error: "Valid text is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Generate embedding using Supabase AI with timeout
    console.log('🤖 Initializing Supabase AI model...');
    
    try {
      const model = new Supabase.ai.Session('gte-small');
      console.log('🤖 Running embedding generation with 15s timeout...');
      
      const embedding = await withTimeout(
        model.run(text.trim(), { mean_pool: true, normalize: true }),
        15000 // 15 second timeout
      );
      
      console.log('✅ Embedding generated successfully');
      console.log('📏 Embedding length:', embedding?.length);
      
      if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('Invalid embedding generated');
      }

      return new Response(
        JSON.stringify({ embedding }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
      
    } catch (aiError) {
      console.error('❌ Supabase AI error:', aiError);
      
      // Return a simple hash-based embedding as fallback
      console.log('🔄 Using fallback embedding generation...');
      const fallbackEmbedding = generateFallbackEmbedding(text.trim());
      
      return new Response(
        JSON.stringify({ 
          embedding: fallbackEmbedding,
          fallback: true,
          message: "Used fallback embedding due to AI timeout"
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

  } catch (error) {
    console.error('❌ Error in generate-embedding function:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate embedding",
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

// Fallback embedding generation using simple text hashing
function generateFallbackEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0);
  
  // Simple hash-based embedding
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    for (let j = 0; j < word.length; j++) {
      const charCode = word.charCodeAt(j);
      const index = (charCode + i * 37 + j * 13) % 384;
      embedding[index] += (charCode / 255) * 0.1;
    }
  }
  
  // Normalize the embedding
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }
  
  return embedding;
}