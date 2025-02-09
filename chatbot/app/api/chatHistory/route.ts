// app/api/chat-history/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '../config';

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (!db) {
      throw new Error('Failed to connect to database');
    }

    const chatCollection = db.collection('chat_interactions');
    
    // Get the most recent 20 messages
    const history = await chatCollection
      .find({})
      .sort({ timestamp: -1 })
      .limit(20)
      .toArray();

    // Transform to frontend format and reverse to get chronological order
    const formattedHistory = history
      .reverse()
      .map(entry => ({
        sender: entry.role === 'user' ? 'user' : 'bot',
        text: entry.content
      }));

    return NextResponse.json({ 
      history: formattedHistory 
    });

  } catch (error) {
    console.error("Error fetching chat history:", error);
    
    // Return empty history instead of error to prevent blocking the chat interface
    return NextResponse.json({ 
      history: [] 
    });
  }
}