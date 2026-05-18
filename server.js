const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = __dirname;
const preferredPort = Number(process.env.PORT || 4173);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ics": "text/calendar; charset=utf-8"
};

function serve(req, res) {
  const safeUrl = decodeURIComponent(req.url.split("?")[0]);
  if (safeUrl === "/api/deepseek") {
    handleDeepSeek(req, res);
    return;
  }

  const requested = safeUrl === "/" ? "/index.html" : safeUrl;
  const filePath = path.normalize(path.join(root, requested));

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": mime[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
}

async function handleDeepSeek(req, res) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8"
  };

  if (req.method === "OPTIONS") {
    res.writeHead(204, headers);
    res.end();
    return;
  }
  if (req.method !== "POST") {
    res.writeHead(405, headers);
    res.end(JSON.stringify({ error: "POST only" }));
    return;
  }

  try {
    const body = await readJsonBody(req);
    const apiKey = String(body.apiKey || process.env.DEEPSEEK_API_KEY || "").trim();
    if (!apiKey) {
      res.writeHead(400, headers);
      res.end(JSON.stringify({ error: "Missing DeepSeek API key" }));
      return;
    }

    const payload = {
      model: body.model || "deepseek-chat",
      messages: Array.isArray(body.messages) ? body.messages : [],
      temperature: body.temperature ?? 0.35
    };
    if (body.thinking) payload.thinking = body.thinking;

    const upstream = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    const text = await upstream.text();
    res.writeHead(upstream.status, {
      ...headers,
      "Content-Type": upstream.headers.get("content-type") || headers["Content-Type"]
    });
    res.end(text);
  } catch (error) {
    res.writeHead(500, headers);
    res.end(JSON.stringify({ error: error.message || "DeepSeek request failed" }));
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function listen(port) {
  const server = http.createServer(serve);
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && port < preferredPort + 20) {
      listen(port + 1);
      return;
    }
    throw error;
  });
  server.listen(port, "0.0.0.0", () => {
    fs.writeFileSync(path.join(root, ".server-port"), String(port));
    console.log(`考研每日任务书 running at http://127.0.0.1:${port}`);
    getLocalAddresses().forEach((address) => {
      console.log(`同一 Wi-Fi 手机/iPad 可尝试打开 http://${address}:${port}`);
    });
  });
}

listen(preferredPort);

function getLocalAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((item) => item && item.family === "IPv4" && !item.internal)
    .map((item) => item.address);
}
