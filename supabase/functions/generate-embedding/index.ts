const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface EmbeddingRequest {
  text: string;
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
  console.log('📝 Request headers:', Object.fromEntries(req.headers.entries()));

  try {
    const requestBody = await req.text();
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

    // Generate embedding using Supabase AI
    console.log('🤖 Initializing Supabase AI model...');
    const model = new Supabase.ai.Session('gte-small');
    console.log('🤖 Running embedding generation...');
    const embedding = await model.run(text.trim(), { mean_pool: true, normalize: true });
    console.log('✅ Embedding generated successfully');
    console.log('📏 Embedding length:', embedding?.length);

    return new Response(
      JSON.stringify({ embedding }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

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