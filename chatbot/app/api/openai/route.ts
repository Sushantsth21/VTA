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
  rating?: 'helpful' | 'unhelpful';
  ratedAt?: Date;
  messages: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }[];
}

const SYSTEM_MESSAGE: Message = {
  role: 'system',
  content: `
  You are CyberTA, for professor Dr.Ankur Chattopadhyay, a specialized virtual teaching assistant for cybersecurity education. Your primary responsibility is to help students understand cybersecurity concepts using ONLY the course materials provided in the retrieved context.

CONTEXT HANDLING:
1. ALWAYS prioritize information from the retrieved course materials (textbooks, lecture slides, quizzes, syllabus) over your pre-trained knowledge.
2. When answering questions, first search the retrieved context for relevant information.
3. EXPLICITLY cite which course material you're referencing (e.g., "According to Lecture 3, slide 7..." or "In Chapter 2 of your textbook...").
4. If the retrieved context doesn't contain information to answer the question completely, clearly state this limitation before providing general guidance.

RESPONSE STRUCTURE:
1. Begin with a direct answer to the student's question based on course materials.
2. Provide supporting explanations with specific references to course materials.
3. Include practical examples or applications that reinforce the concept.
4. End with a thought-provoking question or suggestion for further exploration within course materials.

SECURITY GUARDRAILS:
1. NEVER provide complete solutions to assignments or exam questions.
2. Do not share offensive security techniques without explicitly stating ethical considerations and legal implications.
3. When discussing potentially harmful cybersecurity concepts, always emphasize defensive perspectives and ethical boundaries.
4. If asked to explain how to perform potentially harmful actions, redirect to explaining detection and prevention methods instead.

PEDAGOGICAL APPROACH:
1. Break down complex topics into understandable components.
2. Connect new concepts to previously covered material in the course.
3. Use analogies relevant to cybersecurity to explain difficult concepts.
4. Encourage critical thinking by asking students to consider implications or applications of concepts.

Remember: Your purpose is to help students learn cybersecurity effectively by guiding them to understand and apply concepts from their course materials, not to replace those materials or their own critical thinking.

  `
};

// async function processUserInput(input: string): Promise<string> {
//   const correctionPrompt = `
//   Do not modify anything unnecessarily. Just correct any grammatical mistakes to help the AI understand the user's message better.
// Input: "${input}"

// `;

  // try {
  //   const response = await openai.chat.completions.create({
  //     model: "gpt-4o-mini",
  //     messages: [{ role: "system", content: message }],
  //     temperature: 0,
  //     max_tokens: 150,
  //   });

//     return response.choices[0]?.message?.content?.trim() || input;
//   } catch (error) {
//     console.error("Error processing user input:", error);
//     return input; // Return original input if OpenAI fails
//   }
// }

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

    const chatCollection = db.collection<ChatInteraction>('pilot');

    // Retrieve recent chat history for context
    const chatHistory = await chatCollection
      .find({ sessionId })
      .sort({ timestamp: 1 })
      .toArray();

    // Format chat history with system message
    const formattedChatHistory: Message[] = [
      SYSTEM_MESSAGE,
      ...chatHistory.flatMap(entry => entry.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))),
      { role: 'user', content: message }
    ];

    async function processMessage(message: string) {
      const processedMessage = message.toLowerCase();
  
      // Regex to split sentences while handling abbreviations
      const sentences = processedMessage.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [processedMessage];
  
      return sentences.map(sentence => sentence.trim());
  }
  
    const processedMessage = await processMessage(message);
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
      const queryResponse = await index.namespace('MCY660_V3').query({
        vector: embedding,
        topK: 3,
        includeMetadata: true,
      });

      const metadataResults = queryResponse.matches.map(match => match.metadata);
      console.log(JSON.stringify(metadataResults))

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
        temperature: 0.5,
        max_tokens: 300,
      });

      const reply = response.choices[0]?.message?.content;

      if (!reply) {
        throw new Error("Empty or invalid reply from OpenAI");
      }

      // Store user and assistant messages in a single document
      const chatInteractionResult = await chatCollection.insertOne({
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
        sessionId,
        messages: [
          {
            role: 'user',
            content: message,
            timestamp: new Date(),
          },
          {
            role: 'assistant',
            content: reply,
            timestamp: new Date(),
          }
        ]
      });

      // Return the message ID to allow rating
      return NextResponse.json({
        reply,
        sessionId,
        messageId: chatInteractionResult.insertedId.toString(),
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