const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function breakDownTask(parentTaskTitle: string): string[] {
  const subtasksMap: Record<string, string[]> = {
    "Plan a wedding": [
      "Book wedding venue",
      "Hire photographer",
      "Send invitations",
      "Arrange catering",
      "Plan wedding ceremony",
      "Choose wedding dress",
      "Plan honeymoon"
    ],
    "Start a business": [
      "Choose business idea",
      "Write business plan",
      "Register business",
      "Set up finances",
      "Build online presence",
      "Hire staff",
      "Launch business"
    ],
    "Organize a birthday party": [
      "Choose party theme",
      "Book venue",
      "Send invitations",
      "Order cake",
      "Arrange food and drinks",
      "Plan activities",
      "Buy decorations"
    ]
  };

  return subtasksMap[parentTaskTitle] || [
    "Define main goals",
    "List required resources",
    "Set budget",
    "Create timeline",
    "Assign responsibilities",
    "Execute plan",
    "Review and adjust"
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

    if (!parentTaskTitle) {
      return new Response(
        JSON.stringify({ error: "Parent task title is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const subtasks = breakDownTask(parentTaskTitle);

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
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
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