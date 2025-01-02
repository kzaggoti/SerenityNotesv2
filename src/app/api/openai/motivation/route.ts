import { NextResponse } from 'next/server';
import { openai } from '@/lib/openpipe/config';

export async function POST(req: Request) {
  try {
    const { goals, userData } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an AI motivational coach, providing personalized motivation and actionable recommendations."
        },
        {
          role: "user",
          content: `Generate personalized motivation based on:
User Data: ${JSON.stringify(userData)}
Goals: ${JSON.stringify(goals)}

Format the response as JSON with:
{
  "quotes": ["quote"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "goalMotivation": {
    "goalId": "motivational message"
  }
}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('No response content from AI');
    }

    const response = JSON.parse(completion.choices[0].message.content);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error generating motivation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate motivation' },
      { status: error.status || 500 }
    );
  }
} 