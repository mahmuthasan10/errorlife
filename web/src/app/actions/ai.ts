"use server";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const SYSTEM_PROMPT = `Sen ErrorLife adında yazılımcıların ve mühendislerin takıldığı bir platformun AI asistanısın.
Kullanıcının girdiği taslak metni al; imla hatalarını düzelt, teknik jargona uygun hale getir, okunabilirliği artır ve sonuna bağlama uygun 1-3 teknik hashtag (#react, #bug gibi) ekle.
İçeriğin ana fikrini veya verilen kod snippet'lerini ASLA değiştirme.
Sadece iyileştirilmiş metni döndür, ekstra açıklama veya başlık ekleme.`;

export interface AIResult {
  text: string | null;
  error: string | null;
}

export async function improvePostContent(
  content: string
): Promise<AIResult> {
  const trimmed = content?.trim();

  if (!trimmed) {
    return { text: null, error: "İyileştirilecek metin boş olamaz." };
  }

  if (trimmed.length > 500) {
    return { text: null, error: "Metin en fazla 500 karakter olabilir." };
  }

  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: SYSTEM_PROMPT,
      prompt: trimmed,
      maxTokens: 600,
      temperature: 0.7,
    });

    if (!text) {
      return { text: null, error: "AI yanıt üretemedi. Tekrar deneyin." };
    }

    return { text, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Bilinmeyen hata";

    if (message.includes("API key")) {
      return {
        text: null,
        error: "OpenAI API anahtarı yapılandırılmamış.",
      };
    }

    return {
      text: null,
      error: `AI servisi şu anda yanıt veremiyor: ${message}`,
    };
  }
}
