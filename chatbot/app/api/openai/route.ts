// app/api/openai/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { openai, pc } from '../config';
import { connectToDatabase } from '../config';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

type Message = ChatCompletionMessageParam;

interface ChatInteraction {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sessionId: string;
}

const SYSTEM_MESSAGE: Message = {
  role: 'system',
  content: "You are a knowledgeable and friendly virtual teaching assistant for a cybersecurity class. Use the provided course materials—such as textbooks, lecture slides, quizzes, and the syllabus—to give clear, concise, and accurate answers to student questions. If the context doesn't provide enough information, offer general guidance based on cybersecurity best practices. Always aim to make complex topics easier to understand, and encourage students to think critically. If you're unsure, suggest where students might find the answer in their course materials."
};

async function processUserInput(input: string): Promise<string> {
  const correctionPrompt = `
Check whether there are any mistakes in the following input. If there are mistakes, correct them. 
Then convert it into a question format (who, what, when, how, why, or where) if it is not already. 
Do not modify anything unnecessarily. Keep it simple and proper.
Input: "${input}"
Corrected and Question format:
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: correctionPrompt }],
      temperature: 0,
      max_tokens: 50,
    });

    return response.choices[0]?.message?.content?.trim() || input;
  } catch (error) {
    console.error("Error processing user input:", error);
    return input; // Return original input if OpenAI fails
  }
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sessionId = new Date().toISOString() } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    if (!db) {
      throw new Error('Failed to connect to database');
    }

    const chatCollection = db.collection<ChatInteraction>('chat_interactions');

    // Retrieve recent chat history for context
    const chatHistory = await chatCollection
      .find({ sessionId })
      .sort({ timestamp: 1 })
      .toArray();

    // Format chat history with system message
    const formattedChatHistory: Message[] = [
      SYSTEM_MESSAGE,
      ...chatHistory.map(entry => ({
        role: entry.role,
        content: entry.content
      })),
      { role: 'user', content: message }
    ];
    const processedMessage = await processUserInput(message);
    console.log("processedMessage", processedMessage);

    try {
      // Generate embedding and query index in parallel
      const [embeddingResponse, index] = await Promise.all([
        openai.embeddings.create({
          model: "text-embedding-3-small",
          input: processedMessage,
        }),
        pc.index("vta-risk-management"),
      ]);

      

      const embedding = embeddingResponse.data[0].embedding;

      // Query the vector database
      const queryResponse = await index.namespace('Syllabus-data-betterChuncking').query({
        vector: embedding,
        topK: 3,
        includeMetadata: true,
      });

      const metadataResults = queryResponse.matches.map(match => match.metadata);

      // Prepare messages for OpenAI API
      const messagesForAPI: Message[] = [
        ...formattedChatHistory,
        {
          role: 'user',
          content: `Context: ${JSON.stringify(metadataResults)}
Please use this context to inform your response to the user's latest message.`
        }
      ];

      // Get OpenAI response
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messagesForAPI,
        temperature: 0.7,
        max_tokens: 150,
      });

      const reply = response.choices[0]?.message?.content;

      if (!reply) {
        throw new Error("Empty or invalid reply from OpenAI");
      }

      // Store conversation in database
      await Promise.all([
        chatCollection.insertOne({
          role: 'user',
          content: message,
          timestamp: new Date(),
          sessionId
        }),
        chatCollection.insertOne({
          role: 'assistant',
          content: reply,
          timestamp: new Date(),
          sessionId
        })
      ]);

      return NextResponse.json({
        reply,
        sessionId,
        history: formattedChatHistory
      });

    } catch (error) {
      console.error("OpenAI API Error:", error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : "Failed to process message with OpenAI"
      );
    }

  } catch (error) {
    console.error("Server Error:", error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : "An unexpected error occurred";

    return NextResponse.json(
      { 
        error: errorMessage,
        reply: null,
        history: [] 
      },
      { status: 500 }
    );
  }
}