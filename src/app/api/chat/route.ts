import { NextRequest, NextResponse } from 'next/server';
import { getChatCompletion, SYSTEM_PROMPT, ChatMessage } from '@/lib/groq';
import { MantleAgentCoordinator } from '@/lib/agents/MantleAgentCoordinator';
import { AgentContext } from '@/lib/agents/types';
import { classifyQuery, AGENT_REGISTRY } from '@/lib/agents/AgentTypes';

export async function POST(request: NextRequest) {
  try {
    const { messages, userAddress } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage?.content || '';

    // Classify the query to determine which type of agents to use
    const queryClassification = classifyQuery(userQuery, !!userAddress);
    
    // Check if we should use agents (skip simple greetings)
    const shouldUseAgents = !isSimpleGreeting(userQuery) && 
                           (queryClassification.category !== 'conversational' || userAddress);

    if (shouldUseAgents) {
      try {
        // Check if user has required permissions for the query type
        if (queryClassification.requiresWallet && !userAddress) {
          return NextResponse.json({ 
            content: "I'd love to help with that! Please connect your wallet first so I can access your portfolio data.",
            agentMode: false,
            needsWallet: true
          });
        }

        if (queryClassification.requiresTransaction) {
          return NextResponse.json({ 
            content: `I can help you ${userQuery.toLowerCase()}! However, transaction execution agents are currently being developed. For now, I can analyze your portfolio and suggest the best approach.`,
            agentMode: false,
            needsContracts: true
          });
        }

        const coordinator = new MantleAgentCoordinator();
        
        const agentContext: AgentContext = {
          userAddress,
          userQuery,
          chatHistory: messages,
          // portfolioData will be fetched by agents if needed
        };

        const agentResponse = await coordinator.processQuery(agentContext);
        
        // Format agent response for chat interface
        const formattedResponse = formatAgentResponse(agentResponse as unknown as Record<string, unknown>);
        
        return NextResponse.json({ 
          content: formattedResponse,
          agentMode: true,
          agentData: agentResponse 
        });
      } catch (agentError) {
        console.warn('Agent processing failed, falling back to standard chat:', agentError);
        // Fall through to standard chat completion
      }
    }

    // Standard chat completion (fallback or non-agent queries)
    const chatMessages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((msg: { role: 'user' | 'assistant'; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    const response = await getChatCompletion(chatMessages);

    return NextResponse.json({ content: response, agentMode: false });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

// Helper function to detect simple greetings
function isSimpleGreeting(query: string): boolean {
  const queryLower = query.toLowerCase().trim();
  
  // Simple greetings and very short queries
  const greetings = ['hi', 'hello', 'hey', 'thanks', 'thank you', 'ok', 'okay'];
  
  return queryLower.length < 8 || greetings.includes(queryLower);
}

// Helper function to format agent response for chat
function formatAgentResponse(agentResponse: Record<string, unknown>): string {
  const summary = agentResponse.summary as string || 'I\'ve analyzed your request.';
  
  // Start with the conversational summary
  let formatted = summary;
  
  const recommendations = agentResponse.combinedRecommendations as string[] || [];
  if (recommendations.length > 0) {
    if (recommendations.length === 1) {
      formatted += `\n\n💡 My recommendation: ${recommendations[0]}`;
    } else if (recommendations.length <= 3) {
      formatted += `\n\nHere are my key recommendations:`;
      recommendations.forEach((rec: string) => {
        formatted += `\n• ${rec}`;
      });
    }
  }
  
  const warnings = agentResponse.warnings as string[] || [];
  if (warnings.length > 0) {
    formatted += `\n\n⚠️ Keep in mind: ${warnings.join(' and ')}`;
  }
  
  // Add subtle confidence indicator for live data
  const confidence = (agentResponse.confidence as number) || 0;
  if (confidence > 0.7) {
    formatted += `\n\n*Analysis based on live Mantle Network data* 📊`;
  }
  
  return formatted;
}