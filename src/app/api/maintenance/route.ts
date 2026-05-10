import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { arteries } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not set' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const prompt = `You are an AI infrastructure maintenance planner for a smart city.
I will provide a list of high-risk traffic arteries.
For each artery, generate a specific, technical, and actionable maintenance recommendation (max 2 sentences).

Arteries:
${JSON.stringify(arteries, null, 2)}

Return ONLY a JSON object where keys are the artery IDs and values are the recommendation strings.
Example:
{
  "BRG-1": "Schedule structural load inspection within 48h. Reduce heavy vehicle access on approach.",
  "ART-4B": "Deploy traffic density sensor recalibration. Monitor wet-road traction metrics."
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Attempt to parse JSON response
    const recommendations = JSON.parse(text);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Error generating maintenance recommendations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
