export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method !== "POST") {
      return json({ error: "POST only" }, 405);
    }
    if (!env.DEEPSEEK_API_KEY) {
      return json({ error: "Missing DEEPSEEK_API_KEY" }, 500);
    }

    const body = await request.json();
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: body.model || "deepseek-chat",
        messages: body.messages || [],
        temperature: body.temperature ?? 0.35
      })
    });

    return new Response(await response.text(), {
      status: response.status,
      headers: {
        ...corsHeaders(),
        "Content-Type": "application/json"
      }
    });
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json"
    }
  });
}
