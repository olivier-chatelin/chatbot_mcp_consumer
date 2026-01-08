import { ChatRequest } from '../types/chat.types';

const API_BASE_URL = '/api';

export const sendMessageStream = async (
  message: string,
  conversationHistory: ChatRequest['conversationHistory'],
  onChunk: (content: string) => void,
  onError: (error: string) => void,
  onComplete: () => void
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversationHistory,
      } as ChatRequest),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      // Decode the chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE messages
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6); // Remove 'data: ' prefix
          
          try {
            const parsed = JSON.parse(data);
            
            if (parsed.error) {
              onError(parsed.error);
              return;
            }
            
            if (parsed.done) {
              onComplete();
              return;
            }
            
            if (parsed.content) {
              onChunk(parsed.content);
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
    }

    onComplete();
  } catch (error) {
    console.error('Error sending message:', error);
    onError(error instanceof Error ? error.message : 'Une erreur est survenue');
  }
};
