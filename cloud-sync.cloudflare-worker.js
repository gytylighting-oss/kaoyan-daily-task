export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (!env.SYNC_KV) {
      return json({ error: "Missing SYNC_KV binding" }, 500);
    }
    if (request.method !== "POST") {
      return json({ error: "POST only" }, 405);
    }

    try {
      if (url.pathname === "/sync/upload") return uploadSync(request, env);
      if (url.pathname === "/sync/download") return downloadSync(request, env);
      return json({ error: "Not found" }, 404);
    } catch (error) {
      return json({ error: error.message || "Sync failed" }, 500);
    }
  }
};

async function uploadSync(request, env) {
  const body = await request.json();
  const syncCode = validateSyncCode(body.syncCode);
  const state = body.state;
  if (!state || typeof state !== "object") {
    return json({ error: "Missing state" }, 400);
  }

  const updatedAt = new Date().toISOString();
  const record = {
    version: 1,
    updatedAt,
    app: "kaoyan-daily-task",
    state: sanitizeState(state)
  };
  await env.SYNC_KV.put(await syncKey(syncCode, env), JSON.stringify(record), {
    metadata: { updatedAt }
  });
  return json({ ok: true, updatedAt });
}

async function downloadSync(request, env) {
  const body = await request.json();
  const syncCode = validateSyncCode(body.syncCode);
  const raw = await env.SYNC_KV.get(await syncKey(syncCode, env));
  if (!raw) {
    return json({ error: "No cloud backup for this sync code" }, 404);
  }
  const record = JSON.parse(raw);
  return json({
    ok: true,
    updatedAt: record.updatedAt || "",
    state: record.state || null
  });
}

function validateSyncCode(value) {
  const syncCode = String(value || "").trim();
  if (syncCode.length < 8) throw new Error("Sync code must be at least 8 characters");
  return syncCode;
}

async function syncKey(syncCode, env) {
  const salt = String(env.SYNC_SALT || "kaoyan-daily-task-sync");
  const bytes = new TextEncoder().encode(`${salt}:${syncCode}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return `sync:${toHex(hash)}`;
}

function sanitizeState(state) {
  const copy = JSON.parse(JSON.stringify(state));
  copy.settings = {
    ...(copy.settings || {}),
    cloudSyncUrl: "",
    cloudSyncCode: "",
    deepSeekKey: ""
  };
  return copy;
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders()
  });
}
