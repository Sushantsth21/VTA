import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Provide brief, clear answers using simple words and also add a few details too.' },
        { role: 'user', content: text },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });
    
    return NextResponse.json({ reply: completion.choices[0]?.message?.content });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json({ error: 'Something went wrong!' }, { status: 500 });
  }
}