import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 30;

const optimizeSchema = z.object({
  optimizedText: z.string(),
  suggestedTags: z.array(z.string()).max(3),
});

const SYSTEM_PROMPT = `Sen bir kıdemli yazılım mimarısın. Gelen metni teknik bir forumda (StackOverflow vb.) sorulmaya uygun, net, profesyonel ve anlaşılır hale getir. Metnin orijinal anlamını bozma. Sadece gerekli düzeltmeleri yap.`;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "AI servisi yapılandırılmamış." },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    const body = await req.json().catch(() => null);
    const content: unknown = body?.content;

    if (typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Metin boş olamaz." },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: "Metin en fazla 500 karakter olabilir." },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: optimizeSchema,
      system: SYSTEM_PROMPT,
      prompt: content.trim(),
    });

    return NextResponse.json({ data: object }, { headers: CORS_HEADERS });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Bilinmeyen hata";

    if (message.includes("API key")) {
      return NextResponse.json(
        { error: "OpenAI API anahtarı yapılandırılmamış." },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    return NextResponse.json(
      { error: "AI servisi şu an yanıt veremiyor." },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
