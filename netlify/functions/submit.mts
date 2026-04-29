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

  const { region, district, name, request } = body || {};

  if (
    !region || !district || !name || !request ||
    typeof region !== "string" ||
    typeof district !== "string" ||
    typeof name !== "string" ||
    typeof request !== "string"
  ) {
    return jsonResponse({ ok: false, error: "모든 항목을 입력해주세요." }, 400);
  }

  if (
    region.length > 50 ||
    district.length > 50 ||
    name.length > 50 ||
    request.length > 5000
  ) {
    return jsonResponse({ ok: false, error: "입력 길이가 너무 깁니다." }, 400);
  }

  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const submission = {
    id,
    region: region.trim(),
    district: district.trim(),
    name: name.trim(),
    request: request.trim(),
    submittedAt: new Date().toISOString(),
  };

  try {
    const store = getStore("submissions");
    await store.setJSON(`submission:${id}`, submission);
  } catch (e) {
    console.error("Storage error:", e);
    return jsonResponse({ ok: false, error: "저장 중 오류가 발생했습니다." }, 500);
  }

  return jsonResponse({ ok: true, id });
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const config: Config = {
  path: "/api/submit",
};
