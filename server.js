const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "public");
const dataRoot = path.join(__dirname, "data");
const configPath = path.join(dataRoot, "config.json");
const port = process.env.PORT || 4173;
const host = process.env.HOST || "0.0.0.0";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
};

function readConfig() {
  const envNumber = String(process.env.WHATSAPP_E164 || "").replace(/\D/g, "");
  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return {
      whatsappE164: envNumber || String(parsed.whatsappE164 || "").replace(/\D/g, ""),
    };
  } catch {
    return { whatsappE164: envNumber };
  }
}

function json(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}

function safeResolve(base, requestPath) {
  const resolved = path.normalize(path.join(base, requestPath));
  return resolved.startsWith(base) ? resolved : null;
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(error.code === "ENOENT" ? 404 : 500);
      res.end(error.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }
    res.writeHead(200, {
      "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/config" && req.method === "GET") {
    json(res, 200, readConfig());
    return;
  }

  if (url.pathname === "/api/health" && req.method === "GET") {
    json(res, 200, { ok: true });
    return;
  }

  if (url.pathname === "/api/inquiry" && req.method === "POST") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    let parsed = {};
    try {
      parsed = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    } catch {
      json(res, 400, { ok: false, error: "invalid-json" });
      return;
    }

    const record = {
      receivedAt: new Date().toISOString(),
      name: String(parsed.name || "").trim(),
      email: String(parsed.email || "").trim(),
      need: String(parsed.need || "Not sure yet").trim(),
      source: String(parsed.source || "neuralsync-qbo-consultation"),
    };

    if (!record.name || !record.email) {
      json(res, 400, { ok: false, error: "missing-fields" });
      return;
    }

    fs.mkdirSync(dataRoot, { recursive: true });
    fs.appendFileSync(path.join(dataRoot, "leads.jsonl"), `${JSON.stringify(record)}\n`);
    json(res, 200, { ok: true });
    return;
  }

  const requestPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = safeResolve(root, requestPath);
  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  serveFile(res, filePath);
});

server.listen(port, host, () => {
  console.log(`NeuralSync BPO landing running on http://${host}:${port}`);
});
