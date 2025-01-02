import { NextResponse } from 'next/server';
import { openai } from '@/lib/openpipe/config';

export async function POST(req: Request) {
  try {
    console.log('Starting insights generation...');
    const { surveyData, journalEntries } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    const prompt = `As an AI counselor, analyze the following user data and provide 3-5 meaningful insights about their mental well-being, patterns, and potential areas for growth. Be empathetic and constructive in your analysis.

Survey Data:
${JSON.stringify(surveyData, null, 2)}

Recent Journal Entries:
${journalEntries.slice(0, 5).map((entry: any) => entry.content).join('\n\n')}

Format your response in markdown with each insight as a bullet point:
- Each insight should start with a title in bold using markdown syntax (e.g., "**Title:**")
- Follow with a detailed observation
- Keep insights concise and actionable

For example:
- **Sleep Patterns:** Your analysis shows irregular sleep patterns...
- **Emotional Health:** The data indicates...

Note: Use markdown formatting:
- Bold text with double asterisks: **bold text**
- Start each insight with a hyphen (-)`;

    console.log('Making OpenAI request...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an empathetic and insightful counselor. Always use proper markdown formatting in your responses, especially using ** for bold text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('No response content from AI');
    }

    // Keep the markdown formatting intact
    const insights = completion.choices[0].message.content
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.trim());

    return NextResponse.json({ insights });
  } catch (error: any) {
    console.error('Error details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate insights' },
      { status: error.status || 500 }
    );
  }
} 