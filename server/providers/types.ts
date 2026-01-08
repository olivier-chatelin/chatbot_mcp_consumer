import { Response } from 'express';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface MCPTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface StreamChunk {
  content?: string;
  toolCalls?: ToolCall[];
  done?: boolean;
}

export interface LLMProvider {
  /**
   * Initialize the provider with API key and configuration
   */
  initialize(apiKey: string, config: Record<string, unknown>): void;

  /**
   * Stream a chat completion with optional tool support
   * @param messages - Conversation history
   * @param tools - Available MCP tools
   * @param res - Express response for SSE streaming
   * @param onToolCall - Callback when tool calls are detected
   * @returns Array of tool calls if any
   */
  streamChat(
    messages: ChatMessage[],
    tools: MCPTool[],
    res: Response,
    onToolCall?: (toolCalls: ToolCall[]) => void
  ): Promise<ToolCall[]>;

  /**
   * Get the provider name
   */
  getName(): string;
}
