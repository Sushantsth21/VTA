import { NextRequest, NextResponse } from 'next/server';
import { openai, pc } from '../config';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

type Message = ChatCompletionMessageParam;

let chatHistory: Message[] = [
  { role: 'system', content: "You are a virtual teaching assistant for a cybersecurity class. Provide helpful responses to questions using the given context." }
];

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  if (!message) {
    return NextResponse.json({ reply: null }, { status: 400 });
  }

  try {
    const [embeddingResponse, index] = await Promise.all([
      openai.embeddings.create({
        model: "text-embedding-3-small",
        input: message,
      }),
      pc.index("vta-risk-management"),
    ]);

    const embedding = embeddingResponse.data[0].embedding;

    const queryResponse = await index.namespace('Syllabus-data').query({
      vector: embedding,
      topK: 3,
      includeMetadata: true,
    });

    const metadataResults = queryResponse.matches.map(match => match.metadata);

    console.log('Metadata Results:', JSON.stringify(metadataResults, null, 2));

    chatHistory.push({ role: 'user', content: message });

    const messagesForAPI: ChatCompletionMessageParam[] = [
      ...chatHistory,
      {
        role: 'user',
        content: `Context: ${JSON.stringify(metadataResults)}
        Please use this context to inform your response to the user's latest message.`
      }
    ];

    console.log('Messages for API:', JSON.stringify(messagesForAPI, null, 2));

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messagesForAPI,
      temperature: 0.7,
      max_tokens: 150,
    });

    if (response.choices && response.choices.length > 0) {
      const reply = response.choices[0].message.content;

      if (reply) {
        chatHistory.push({ role: 'assistant', content: reply });

        if (chatHistory.length > 11) {
          chatHistory = [
            chatHistory[0],
            ...chatHistory.slice(-10)
          ];
        }

        console.log('Final Chat History:', JSON.stringify(chatHistory, null, 2));

        return NextResponse.json({ reply, history: chatHistory });
      } else {
        throw new Error("Empty reply from OpenAI");
      }
    } else {
      throw new Error("Unexpected response structure from OpenAI");
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ reply: null, history: chatHistory }, { status: 500 });
  }
}
