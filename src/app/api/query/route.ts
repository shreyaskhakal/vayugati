import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, context } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not set' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are the AI intelligence layer of Vayu-Gati, a real-time smart city digital twin dashboard for Indian cities.
You answer questions from city operators based on real-time telemetry data.

Current App State (Telemetry Context):
${JSON.stringify(context, null, 2)}

Operator Query: ${question}

Instructions:
- Answer concisely and professionally in 2-4 sentences maximum.
- Use specific numbers and node IDs from the context when available.
- Do not say you are an AI. Respond as the city intelligence system.
- If data is unavailable, say "Telemetry unavailable for that parameter."
- Format numbers clearly (e.g., "72% load", "120ms latency").`;

    const result = await model.generateContentStream(prompt);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            controller.enqueue(new TextEncoder().encode(chunk.text()));
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (error) {
    console.error('Query API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
