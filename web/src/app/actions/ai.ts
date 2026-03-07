"use server";

import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const optimizeSchema = z.object({
  optimizedText: z
    .string()
    .describe(
      "Yazım hataları giderilmiş, daha profesyonel ve net ifade edilmiş teknik sorun metni."
    ),
  suggestedTags: z
    .array(z.string())
    .max(3)
    .describe(
      "Bu sorunu en iyi tanımlayan max 3 adet teknoloji/kavram etiketi (ör: react, database-design, typescript)."
    ),
});

export type OptimizeResult = {
  optimizedText: string;
  suggestedTags: string[];
} | null;

export type AIActionResult = {
  data: OptimizeResult;
  error: string | null;
};

const SYSTEM_PROMPT = `Sen bir kıdemli yazılım mimarısın. Gelen metni teknik bir forumda (StackOverflow vb.) sorulmaya uygun, net, profesyonel ve anlaşılır hale getir. Metnin orijinal anlamını bozma. Sadece gerekli düzeltmeleri yap.`;

export async function optimizePostContent(
  content: string
): Promise<AIActionResult> {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: "Bu özelliği kullanmak için giriş yapmalısınız.",
      };
    }

    const trimmed = content?.trim();

    if (!trimmed) {
      return { data: null, error: "İyileştirilecek metin boş olamaz." };
    }

    if (trimmed.length > 500) {
      return {
        data: null,
        error: "Metin en fazla 500 karakter olabilir.",
      };
    }

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: optimizeSchema,
      system: SYSTEM_PROMPT,
      prompt: trimmed,
    });

    if (!object.optimizedText) {
      return {
        data: null,
        error: "AI yanıt üretemedi. Lütfen tekrar deneyin.",
      };
    }

    return {
      data: {
        optimizedText: object.optimizedText,
        suggestedTags: object.suggestedTags,
      },
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";

    if (message.includes("API key")) {
      return {
        data: null,
        error: "OpenAI API anahtarı yapılandırılmamış.",
      };
    }

    return {
      data: null,
      error: `AI servisi şu anda yanıt veremiyor: ${message}`,
    };
  }
}
