import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const port = 4173;

const envPath = join(root, ".env");
if (existsSync(envPath)) {
  const env = readFileSync(envPath, "utf8");
  for (const line of env.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (key && !process.env[key]) {
      process.env[key] = valueParts.join("=").trim();
    }
  }
}

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-5-mini";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Request body too large"));
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function extractResponseText(payload) {
  if (typeof payload.output_text === "string") return payload.output_text;
  const parts = [];
  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

async function callOpenAI(instructions, input) {
  if (!apiKey) {
    const error = new Error("OPENAI_API_KEY is not configured");
    error.status = 503;
    throw error;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions,
      input,
      text: {
        format: {
          type: "json_schema",
          name: "sales_email_response",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              intro: { type: "array", items: { type: "string" } },
              contents: { type: "array", items: { type: "string" } },
              sections: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    no: { type: "string" },
                    title: { type: "string" },
                    body: { type: "array", items: { type: "string" } },
                  },
                  required: ["no", "title", "body"],
                },
              },
              followup: { type: "string" },
            },
            required: ["title", "intro", "contents", "sections", "followup"],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`OpenAI API error: ${response.status}`);
    error.status = response.status;
    error.detail = detail.slice(0, 500);
    throw error;
  }

  const payload = await response.json();
  return JSON.parse(extractResponseText(payload));
}

async function handleGenerate(request, response) {
  const input = await readJson(request);
  const result = await callOpenAI(
    [
      "너는 B2B 영업 제안 메일을 작성하는 한국어 세일즈 카피라이터다.",
      "출력은 타이틀, 인사/발신 배경, 목차, 01~05 섹션, 후속메일로 구성한다.",
      "문체는 정중하고 실무적이어야 하며 과장된 성과 보장 표현은 피한다.",
      "섹션은 01 발신 배경, 02 진단 결과, 03 핵심 솔루션, 04 기대 효과, 05 미팅 제안 순서를 기본으로 한다.",
      "각 섹션 body는 1~3문장으로 작성한다.",
    ].join("\n"),
    JSON.stringify(input)
  );
  sendJson(response, 200, result);
}

async function handleEdit(request, response) {
  const input = await readJson(request);
  const result = await callOpenAI(
    [
      "너는 기존 B2B 영업 제안 메일을 사용자의 요청대로 수정하는 한국어 에디터다.",
      "기존 구조인 타이틀, 목차, 01~05 섹션, 후속메일 구조는 유지한다.",
      "사용자 요청을 반영하되 과장된 성과 보장, 허위 수상, 최저가 보장 표현은 피한다.",
      "HTML이 아니라 구조화 JSON으로만 반환한다.",
    ].join("\n"),
    JSON.stringify(input)
  );
  sendJson(response, 200, result);
}

createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

  try {
    if (request.method === "POST" && url.pathname === "/api/generate-mail") {
      await handleGenerate(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/edit-mail") {
      await handleEdit(request, response);
      return;
    }
  } catch (error) {
    sendJson(response, error.status || 500, {
      error: error.message,
      detail: error.detail || "",
    });
    return;
  }

  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(root, safePath);

  try {
    const file = await readFile(filePath);
    response.writeHead(200, { "Content-Type": types[extname(filePath)] ?? "application/octet-stream" });
    response.end(file);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`SalesKit AI preview: http://127.0.0.1:${port}`);
});
