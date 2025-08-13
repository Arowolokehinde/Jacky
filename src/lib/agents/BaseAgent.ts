import { getChatCompletion } from '../groq';
import { AgentResponse, AgentContext } from './types';

export abstract class BaseAgent {
  protected name: string;
  protected expertise: string;
  protected systemPrompt: string;

  constructor(name: string, expertise: string, systemPrompt: string) {
    this.name = name;
    this.expertise = expertise;
    this.systemPrompt = systemPrompt;
  }

  abstract analyze(context: AgentContext): Promise<AgentResponse>;

  protected async callLLM(prompt: string, context?: Record<string, unknown>): Promise<string> {
    try {
      const fullPrompt = `${this.systemPrompt}

IMPORTANT: Respond in natural, conversational language. DO NOT use JSON format. Be helpful and friendly.

Context: ${context ? JSON.stringify(context, null, 2) : 'None'}

User Query: ${prompt}

Please provide a conversational response that explains your analysis in plain English.`;
      
      const response = await getChatCompletion([
        {
          role: 'user',
          content: fullPrompt
        }
      ], 'llama-3.1-8b-instant');

      return response;
    } catch (error) {
      console.error(`Error in ${this.name} agent:`, error);
      throw new Error(`Agent ${this.name} failed to process request`);
    }
  }

  protected parseResponse(llmResponse: string): { analysis: string; recommendations: string[]; warnings?: string[] } {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(llmResponse);
      return {
        analysis: parsed.analysis || llmResponse,
        recommendations: parsed.recommendations || [],
        warnings: parsed.warnings || []
      };
    } catch {
      // If not JSON, parse manually
      const lines = llmResponse.split('\n').filter(line => line.trim());
      let analysis = '';
      const recommendations: string[] = [];
      const warnings: string[] = [];
      
      let currentSection = 'analysis';
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.toLowerCase().includes('recommendation')) {
          currentSection = 'recommendations';
          continue;
        }
        if (trimmed.toLowerCase().includes('warning')) {
          currentSection = 'warnings';
          continue;
        }
        
        if (currentSection === 'analysis') {
          analysis += trimmed + ' ';
        } else if (currentSection === 'recommendations' && trimmed.startsWith('-')) {
          recommendations.push(trimmed.substring(1).trim());
        } else if (currentSection === 'warnings' && trimmed.startsWith('-')) {
          warnings.push(trimmed.substring(1).trim());
        }
      }
      
      return {
        analysis: analysis.trim() || llmResponse,
        recommendations,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }
  }
}