import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, context } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not set in environment variables' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are the intelligence layer of the Vayu-Gati smart city digital twin. 
You answer questions from the city operators based on the real-time telemetry context provided.

Context (Real-time App State):
${JSON.stringify(context, null, 2)}

Operator Query:
${question}

Instructions:
- Provide a concise, helpful, and professional answer based only on the context provided.
- Do not mention that you are an AI or using context. Just answer directly.
- If the question cannot be answered by the context, state that the information is currently unavailable in the telemetry stream.`;

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
    console.error('Error in query API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
