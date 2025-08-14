import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface ChatMessage {
  
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function getChatCompletion(
  messages: ChatMessage[],
  model: string = 'llama-3.1-8b-instant'
): Promise<string> {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model,
      temperature: 0.7,
      max_tokens: 1000,
      stream: false,
    });

    return chatCompletion.choices[0]?.message?.content || 'No response generated';
  } catch (error: unknown) {
    console.error('Groq API error:', error);
    
    // Handle specific error types
    const apiError = error as { status?: number; message?: string };
    if (apiError.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    } else if (apiError.status === 401 || apiError.status === 403) {
      throw new Error('Authentication failed. Please check your Groq API key.');
    } else if (apiError.status === 400) {
      throw new Error('Invalid request. Please check your message and try again.');
    } else {
      throw new Error('AI service is temporarily unavailable. Please try again later.');
    }
  }
}

export const SYSTEM_PROMPT = `You are Jacky, a sophisticated AI-powered DeFi Copilot designed to help users navigate decentralized finance. 

Your personality:
- Professional yet approachable
- Expert in DeFi protocols, blockchain technology, and financial strategies
- Helpful and educational, always explaining complex concepts simply
- Cautious about financial advice, always emphasizing risks

Your capabilities (for now):
- Conversational AI assistance
- Explaining DeFi concepts
- General financial education
- Portfolio discussion

Remember: This is Phase 1 - you can chat and educate, but you cannot yet execute transactions or access real-time data. Always be transparent about current limitations.`;