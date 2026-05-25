const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export type OptimizeResult = {
  optimizedText: string;
  suggestedTags: string[];
};

export type OptimizeResponse =
  | { ok: true; data: OptimizeResult }
  | { ok: false; error: string };

export async function optimizePost(
  content: string,
  signal?: AbortSignal,
): Promise<OptimizeResponse> {
  if (!BASE_URL) {
    return {
      ok: false,
      error: "API URL yapılandırılmamış. EXPO_PUBLIC_API_URL'i kontrol edin.",
    };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return { ok: false, error: "Metin boş olamaz." };
  }
  if (trimmed.length > 500) {
    return { ok: false, error: "Metin en fazla 500 karakter olabilir." };
  }

  try {
    const res = await fetch(`${BASE_URL}/api/ai/optimize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ content: trimmed }),
      signal,
    });

    const json = (await res.json().catch(() => null)) as
      | { data?: OptimizeResult; error?: string }
      | null;

    if (!res.ok || !json?.data) {
      return {
        ok: false,
        error: json?.error ?? `İstek başarısız (HTTP ${res.status}).`,
      };
    }

    return { ok: true, data: json.data };
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      return { ok: false, error: "İstek iptal edildi." };
    }
    return {
      ok: false,
      error: "Ağ hatası. İnternet bağlantınızı kontrol edin.",
    };
  }
}
