import { useState, useCallback, useRef } from 'react';
import { Message } from '../types/chat.types';
import { sendMessageStream } from '../services/chatService';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);

  const sendUserMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    // Create placeholder for assistant message
    const assistantMessageId = (Date.now() + 1).toString();
    streamingMessageIdRef.current = assistantMessageId;

    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);

    // Stream the response
    await sendMessageStream(
      content.trim(),
      messages,
      // onChunk - append content to the streaming message
      (chunk: string) => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId
              ? { ...msg, content: msg.content + chunk }
              : msg
          )
        );
      },
      // onError
      (errorMessage: string) => {
        setError(errorMessage);
        setIsLoading(false);
        streamingMessageIdRef.current = null;
        // Remove the empty assistant message if error occurred
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId || msg.content !== ''));
      },
      // onComplete
      () => {
        setIsLoading(false);
        streamingMessageIdRef.current = null;
      }
    );
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendUserMessage,
    clearMessages,
  };
};
