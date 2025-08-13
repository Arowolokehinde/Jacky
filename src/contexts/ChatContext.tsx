'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, ChatState, ChatContextType } from '@/types/chat';
import { useAccount, useChainId } from 'wagmi';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_MESSAGES' };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
        error: null,
      };
    default:
      return state;
  }
}

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
};

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { address } = useAccount();
  const chainId = useChainId();

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    dispatch({ type: 'SET_ERROR', payload: null });
    
    const userMessage: Message = {
      id: uuidv4(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...state.messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          userAddress: address, // Pass wallet address for agent analysis
          chainId: chainId,     // Pass chain ID for network-specific logic
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: uuidv4(),
        content: data.content,
        role: 'assistant',
        timestamp: new Date(),
        agentMode: data.agentMode || false,
        agentData: data.agentData,
      };

      dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
    } catch (error) {
      console.error('Send message error:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to send message. Please try again.' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearMessages = () => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  };

  const value: ChatContextType = {
    messages: state.messages,
    sendMessage,
    isLoading: state.isLoading,
    error: state.error,
    clearMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}