import { logger } from "./logger";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const REQUEST_TIMEOUT_MS = 15_000;

export type OptimizeResult = {
  optimizedText: string;
  suggestedTags: string[];
};

export type OptimizeError =
  | { kind: "config";     message: string }
  | { kind: "validation"; message: string }
  | { kind: "network";    message: string }
  | { kind: "timeout";    message: string }
  | { kind: "server";     status: number; message: string };

export type OptimizeResponse =
  | { ok: true;  data: OptimizeResult }
  | { ok: false; error: OptimizeError };

export async function optimizePost(
  content: string,
  externalSignal?: AbortSignal
): Promise<OptimizeResponse> {
  if (!BASE_URL) {
    logger.warn("ai.optimize.no_base_url");
    return { ok: false, error: { kind: "config", message: "EXPO_PUBLIC_API_URL tanımsız." } };
  }

  const trimmed = content.trim();
  if (!trimmed)           return { ok: false, error: { kind: "validation", message: "Metin boş olamaz." } };
  if (trimmed.length > 500) return { ok: false, error: { kind: "validation", message: "Metin en fazla 500 karakter." } };

  const ac = new AbortController();
  const timeoutId = setTimeout(() => ac.abort("timeout"), REQUEST_TIMEOUT_MS);

  function onExternalAbort() { ac.abort("external"); }
  externalSignal?.addEventListener("abort", onExternalAbort);

  const url = `${BASE_URL}/api/ai/optimize`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ content: trimmed }),
      signal: ac.signal,
    });

    const raw = await res.text();
    type JsonBody = { data?: OptimizeResult; error?: string };
    let json: JsonBody | null = null;
    try { json = raw ? (JSON.parse(raw) as JsonBody) : null; } catch { /* handled below */ }

    if (!res.ok) {
      logger.error("ai.optimize.http_error", { status: res.status, url, raw: raw.slice(0, 300) });
      return {
        ok: false,
        error: { kind: "server", status: res.status, message: json?.error ?? `Sunucu hatası (${res.status}).` },
      };
    }

    if (!json?.data) {
      logger.error("ai.optimize.bad_payload", { raw: raw.slice(0, 300) });
      return { ok: false, error: { kind: "server", status: res.status, message: "Geçersiz yanıt formatı." } };
    }

    return { ok: true, data: json.data };
  } catch (err) {
    const reason = (ac.signal as AbortSignal & { reason?: string }).reason;
    if ((err as Error).name === "AbortError" && reason === "timeout") {
      logger.warn("ai.optimize.timeout", { url });
      return { ok: false, error: { kind: "timeout", message: "AI servisi zaman aşımına uğradı (15sn)." } };
    }
    if ((err as Error).name === "AbortError") {
      return { ok: false, error: { kind: "network", message: "İstek iptal edildi." } };
    }
    logger.error("ai.optimize.network", { err: String(err), url });
    return { ok: false, error: { kind: "network", message: "Ağ hatası. Bağlantınızı kontrol edin." } };
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}
