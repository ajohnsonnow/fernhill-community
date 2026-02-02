'use client';

// ==============================================
// AI Assistant UI Components
// Phase J: Supernova v1.16.0
// ==============================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  parseIntent,
  QUICK_ACTIONS,
  getRandomResponse,
  type ParsedIntent,
} from '@/lib/ai-assistant';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  intent?: ParsedIntent;
  isLoading?: boolean;
}

interface AIAssistantProps {
  onSearch?: (query: string, intent: ParsedIntent) => void;
  onClose?: () => void;
}

export function AIAssistant({ onSearch, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: getRandomResponse('greeting'),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(async (query: string) => {
    if (!query.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    // Add loading message
    const loadingId = (Date.now() + 1).toString();
    setMessages(prev => [
      ...prev,
      {
        id: loadingId,
        role: 'assistant',
        content: getRandomResponse('thinking'),
        timestamp: new Date(),
        isLoading: true,
      },
    ]);

    // Parse intent
    const intent = parseIntent(query);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Remove loading message and add response
    setMessages(prev => {
      const filtered = prev.filter(m => m.id !== loadingId);
      return [
        ...filtered,
        {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: intent.suggestedResponse || getRandomResponse('noResults'),
          timestamp: new Date(),
          intent,
        },
      ];
    });

    setIsProcessing(false);
    onSearch?.(query, intent);
  }, [isProcessing, onSearch]);

  const handleQuickAction = (action: string) => {
    handleSubmit(action);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-500 to-pink-500">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h2 className="font-bold text-white">Fernhill AI</h2>
            <p className="text-xs text-white/80">Your community assistant</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2"
            aria-label="Close assistant"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-500 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.slice(0, 4).map(action => (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action.label)}
                className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSubmit(input);
          }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="px-4 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? '...' : '→'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          isAssistant
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            : 'bg-purple-500 text-white'
        } ${message.isLoading ? 'animate-pulse' : ''}`}
      >
        <p className="text-sm">{message.content}</p>
        {message.intent && message.intent.confidence > 0.5 && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500">
              Intent: {message.intent.type} ({Math.round(message.intent.confidence * 100)}% confident)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Floating AI Button
export function AIAssistantFAB({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform z-50"
      aria-label="Open AI Assistant"
    >
      🤖
    </button>
  );
}

// AI Search Bar (inline version)
export function AISearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div
        className={`flex items-center bg-white dark:bg-gray-800 rounded-full border-2 transition-colors ${
          isFocused ? 'border-purple-500' : 'border-gray-200 dark:border-gray-700'
        }`}
      >
        <span className="pl-4 text-gray-400">🔍</span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Ask AI to find events..."
          className="flex-1 px-3 py-3 bg-transparent focus:outline-none"
        />
        {query && (
          <button
            type="submit"
            className="mr-2 px-4 py-1.5 bg-purple-500 text-white text-sm rounded-full hover:bg-purple-600 transition-colors"
          >
            Search
          </button>
        )}
      </div>
    </form>
  );
}

export default AIAssistant;
