import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  // Add timeout and retry configuration
  timeout: 30000, // 30 seconds
});

export const groqClient = groq;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on authentication or client errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status === 400 || status === 401 || status === 403) {
          throw error;
        }
      }
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

export async function getChatCompletion(
  messages: ChatMessage[],
  model: string = 'llama-3.1-8b-instant'
): Promise<string> {
  try {
    const result = await retryWithBackoff(async () => {
      return await groq.chat.completions.create({
        messages,
        model,
        temperature: 0.7,
        max_tokens: 400,
        stream: false,
      });
    });

    return result.choices[0]?.message?.content || 'No response generated';
  } catch (error: unknown) {
    console.error('Groq API error:', error);
    
    // Enhanced error handling with network detection
    const errorMessage = error && typeof error === 'object' && 'message' in error 
      ? String(error.message) 
      : String(error);
    
    // Network connectivity issues
    if (errorMessage.includes('ENOTFOUND') || 
        errorMessage.includes('ECONNREFUSED') || 
        errorMessage.includes('Connection error') ||
        errorMessage.includes('Network request failed')) {
      throw new Error('Network connection failed. Please check your internet connection and try again.');
    }
    
    // Handle specific HTTP status codes
    const apiError = error as { status?: number; message?: string };
    if (apiError.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    } else if (apiError.status === 401 || apiError.status === 403) {
      throw new Error('Authentication failed. Please check your Groq API key.');
    } else if (apiError.status === 400) {
      throw new Error('Invalid request. Please check your message and try again.');
    } else if (apiError.status && apiError.status >= 500) {
      throw new Error('Groq servers are temporarily down. Please try again in a few minutes.');
    } else {
      throw new Error('AI service is temporarily unavailable. Please try again later.');
    }
  }
}

export const SYSTEM_PROMPT = `You are Jacky, a friendly AI-powered DeFi Copilot for Mantle Network. 

Your personality:
- Conversational and helpful
- Expert in Mantle Network, Agni Finance, Merchant Moe, and DeFi
- Educational but not overwhelming 
- Enthusiastic about DeFi opportunities while being mindful of risks

Your capabilities:
- Answer questions about DeFi, Mantle Network, and crypto
- Explain how to use Agni Finance, Merchant Moe, and other Mantle protocols
- Help users understand wallet connections, swaps, and yield farming
- Provide guidance on getting started with Mantle DeFi

Be conversational and friendly. For complex portfolio analysis, users can ask "analyze my portfolio" to get detailed insights. For simple questions, just chat normally without being overly technical.

Keep responses concise and helpful!`;