import { NextRequest, NextResponse } from 'next/server';
import { getChatCompletion, SYSTEM_PROMPT, ChatMessage } from '@/lib/groq';
import { NewAgentCoordinator } from '@/lib/agents/NewAgentCoordinator';
import { AgentContext } from '@/lib/agents/types';

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

    // Check if we should use agents (skip simple greetings)
    const shouldUseAgents = !isSimpleGreeting(userQuery);

    if (shouldUseAgents) {
      try {
        const coordinator = new NewAgentCoordinator();
        
        const agentContext: AgentContext = {
          userAddress,
          userQuery,
          chatHistory: messages,
          // portfolioData will be fetched by agents if needed
        };

        const agentResponse = await coordinator.processQuery(agentContext);
        
        // Check if wallet is required but not provided
        if (agentResponse.requiresWallet && !userAddress) {
          return NextResponse.json({ 
            content: agentResponse.response.analysis,
            agentMode: true,
            agentType: agentResponse.agent,
            needsWallet: true,
            agentData: agentResponse
          });
        }

        // Check if transaction approval is required
        if (agentResponse.requiresTransaction) {
          return NextResponse.json({ 
            content: agentResponse.response.analysis,
            agentMode: true,
            agentType: agentResponse.agent,
            needsTransaction: true,
            agentData: agentResponse
          });
        }

        // Format agent response for chat interface
        const formattedResponse = formatSpecializedAgentResponse(agentResponse);
        
        return NextResponse.json({ 
          content: formattedResponse,
          agentMode: true,
          agentType: agentResponse.agent,
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

// Helper function to format specialized agent response for chat
function formatSpecializedAgentResponse(agentResponse: { agent: string; response: { analysis: string; recommendations?: string[]; warnings?: string[]; confidence: number } }): string {
  const response = agentResponse.response;
  const agentName = agentResponse.agent.charAt(0).toUpperCase() + agentResponse.agent.slice(1);
  
  // Start with the agent's analysis
  let formatted = response.analysis;
  
  // Add recommendations
  const recommendations = response.recommendations || [];
  if (recommendations.length > 0) {
    if (recommendations.length === 1) {
      formatted += `\n\n💡 ${agentName}'s recommendation: ${recommendations[0]}`;
    } else {
      formatted += `\n\n📋 ${agentName}'s recommendations:`;
      recommendations.slice(0, 5).forEach((rec: string, index: number) => {
        formatted += `\n${index + 1}. ${rec}`;
      });
    }
  }
  
  // Add warnings if any
  const warnings = response.warnings || [];
  if (warnings.length > 0) {
    formatted += `\n\n⚠️ Important: ${warnings.join('; ')}`;
  }
  
  // Add confidence indicator based on agent type
  const confidence = response.confidence || 0;
  if (confidence > 0.8) {
    const agentIndicators = {
      jacky: '📚 Educational content verified',
      franky: '💰 Portfolio data analysis complete',
      kranky: '⚡ Staking data and Chainlink feeds active'
    };
    const indicator = agentIndicators[agentResponse.agent as keyof typeof agentIndicators] || 'Analysis complete';
    formatted += `\n\n*${indicator}*`;
  }
  
  return formatted;
}