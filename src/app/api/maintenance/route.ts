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
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `You are an AI infrastructure maintenance planner for Indian smart cities (Pune metro area).
Given high-risk traffic arteries, generate specific, actionable maintenance recommendations.

Arteries (IDs with risk %):
${JSON.stringify(arteries, null, 2)}

Return ONLY a valid JSON object where keys are artery IDs and values are recommendation strings (max 2 sentences each).
Be specific — mention inspection timelines, sensor types, or traffic management actions.
Example:
{
  "BRG-1": "Schedule structural load inspection within 48h. Restrict heavy vehicles on NH-48 approach road.",
  "ART-4B": "Recalibrate density sensors in Sector 4. Deploy wet-road friction monitoring before monsoon onset."
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let recommendations: Record<string, string> = {};
    try {
      recommendations = JSON.parse(text);
    } catch {
      // fallback static recommendations
      arteries.forEach((id: string) => {
        recommendations[id] = 'Schedule inspection within 72h. Monitor load metrics continuously.';
      });
    }

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Maintenance API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
