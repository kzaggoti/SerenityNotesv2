import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message, userData } = await req.json();

    // Prepare context from user data
    const userContext = userData ? `
      Survey Data: ${JSON.stringify(userData.surveyData)}
      Recent Journal Entries: ${JSON.stringify(userData.journalEntries.slice(-3))}
    ` : 'No user data available';

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an empathetic AI counselor. Your role is to provide supportive, understanding responses 
          while helping users work through their thoughts and feelings. Use the following context about the user 
          to provide personalized guidance, but don't directly reference that you have this information.
          
          ${userContext}`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return NextResponse.json({
      response: response.choices[0].message.content
    });

  } catch (error) {
    console.error('Counselor API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
} 