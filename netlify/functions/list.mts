import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON" }, 400);
  }

  const { password } = body || {};
  const adminPassword = Netlify.env.get("ADMIN_PASSWORD");

  if (!adminPassword) {
    console.error("ADMIN_PASSWORD env var not set");
    return jsonResponse({ ok: false, error: "Server not configured" }, 500);
  }

  if (password !== adminPassword) {
    return jsonResponse({ ok: false, error: "Invalid password" }, 401);
  }

  try {
    const store = getStore("submissions");
    const { blobs } = await store.list({ prefix: "submission:" });

    const submissions = await Promise.all(
      blobs.map(async (b) => {
        try {
          return await store.get(b.key, { type: "json" });
        } catch {
          return null;
        }
      })
    );

    const valid = submissions.filter(Boolean);
    valid.sort((a: any, b: any) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    return jsonResponse({ ok: true, submissions: valid });
  } catch (e) {
    console.error("List error:", e);
    return jsonResponse({ ok: false, error: "조회 중 오류가 발생했습니다." }, 500);
  }
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const config: Config = {
  path: "/api/list",
};
