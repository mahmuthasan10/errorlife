import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const optimizeSchema = z.object({
  optimizedText: z.string(),
  suggestedTags: z.array(z.string()).max(3),
});

const SYSTEM_PROMPT = `Sen bir kıdemli yazılım mimarısın. Gelen metni teknik bir forumda (StackOverflow vb.) sorulmaya uygun, net, profesyonel ve anlaşılır hale getir. Metnin orijinal anlamını bozma. Sadece gerekli düzeltmeleri yap.`;

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    if (!content || content.length > 500) {
      return NextResponse.json({ error: 'Geçersiz metin uzunluğu.' }, { status: 400 });
    }

    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: optimizeSchema,
      system: SYSTEM_PROMPT,
      prompt: content,
    });

    return NextResponse.json({ data: object });
  } catch (error) {
    console.error('AI Optimize Error:', error);
    return NextResponse.json({ error: 'AI servisi şu an yanıt veremiyor.' }, { status: 500 });
  }
}