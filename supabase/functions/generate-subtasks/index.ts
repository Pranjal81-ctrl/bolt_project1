const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

async function generateSubtasksWithAI(parentTaskTitle: string): Promise<string[]> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    // Fallback to predefined logic if no OpenAI key
    return getPreDefinedSubtasks(parentTaskTitle);
  }

  try {
    const prompt = `Break down the following task into 5-7 clear, actionable subtasks. Return only a JSON array of strings, no additional text or formatting:

Task: "${parentTaskTitle}"

Example format:
["Subtask 1", "Subtask 2", "Subtask 3", "Subtask 4", "Subtask 5"]`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that breaks down tasks into actionable subtasks. Always respond with a valid JSON array of strings.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data: OpenAIResponse = await response.json();
    const content = data.choices[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Parse the JSON response
    const subtasks = JSON.parse(content);
    
    if (!Array.isArray(subtasks)) {
      throw new Error('Invalid response format from OpenAI');
    }

    // Ensure we have 5-7 subtasks
    const filteredSubtasks = subtasks
      .filter(task => typeof task === 'string' && task.trim().length > 0)
      .slice(0, 7);

    if (filteredSubtasks.length < 3) {
      throw new Error('Insufficient subtasks generated');
    }

    return filteredSubtasks;
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fallback to predefined logic
    return getPreDefinedSubtasks(parentTaskTitle);
  }
}

function getPreDefinedSubtasks(parentTaskTitle: string): string[] {
  const subtasksMap: Record<string, string[]> = {
    "plan a wedding": [
      "Book wedding venue",
      "Hire photographer",
      "Send invitations",
      "Arrange catering",
      "Plan wedding ceremony",
      "Choose wedding dress",
      "Plan honeymoon"
    ],
    "start a business": [
      "Choose business idea",
      "Write business plan",
      "Register business",
      "Set up finances",
      "Build online presence",
      "Hire staff",
      "Launch business"
    ],
    "organize a birthday party": [
      "Choose party theme",
      "Book venue",
      "Send invitations",
      "Order cake",
      "Arrange food and drinks",
      "Plan activities",
      "Buy decorations"
    ],
    "write a book": [
      "Outline the plot and chapters",
      "Write the first draft",
      "Edit and revise the manuscript",
      "Design the book cover",
      "Format for publishing",
      "Plan book launch and marketing"
    ],
    "build a website": [
      "Define website purpose and audience",
      "Choose domain name and hosting",
      "Design site layout",
      "Develop homepage content",
      "Test responsiveness and links",
      "Deploy the website"
    ],
    "create a garden": [
      "Plan garden layout and design",
      "Prepare soil and remove weeds",
      "Purchase plants and seeds",
      "Install irrigation system",
      "Plant flowers and vegetables",
      "Set up garden maintenance schedule"
    ],
    "learn a new language": [
      "Choose learning method and resources",
      "Set daily practice schedule",
      "Learn basic vocabulary and phrases",
      "Practice speaking with native speakers",
      "Study grammar rules",
      "Take proficiency test"
    ]
  };

  const normalizedTitle = parentTaskTitle.toLowerCase().trim();
  
  // Try exact match first
  if (subtasksMap[normalizedTitle]) {
    return subtasksMap[normalizedTitle];
  }
  
  // Try partial matches
  for (const [key, value] of Object.entries(subtasksMap)) {
    if (normalizedTitle.includes(key) || key.includes(normalizedTitle)) {
      return value;
    }
  }

  // Generic fallback
  return [
    `Define scope and requirements for "${parentTaskTitle}"`,
    "Research and gather necessary resources",
    "Create detailed action plan",
    "Execute the main phase of work",
    "Review and test the results",
    "Make final adjustments and improvements",
    "Complete and deliver the final outcome"
  ];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { parentTaskTitle } = await req.json();

    if (!parentTaskTitle || typeof parentTaskTitle !== 'string') {
      return new Response(
        JSON.stringify({ error: "Valid parent task title is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const subtasks = await generateSubtasksWithAI(parentTaskTitle.trim());

    return new Response(
      JSON.stringify({ subtasks }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error('Error in generate-subtasks function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate subtasks",
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