import OpenAI from 'openai';
import { Response } from 'express';
import { LLMProvider, ChatMessage, MCPTool, ToolCall } from './types.js';

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI | null = null;
  private model: string = 'gpt-4';
  private maxTokens: number = 5000;

  initialize(apiKey: string, config: Record<string, unknown>): void {
    this.client = new OpenAI({ apiKey });
    this.model = (config.model as string) || 'gpt-4';
    this.maxTokens = (config.maxTokens as number) || 5000;
    console.log(`✅ OpenAI provider initialized with model: ${this.model}`);
  }

  async streamChat(
    messages: ChatMessage[],
    tools: MCPTool[],
    res: Response,
    onToolCall?: (toolCalls: ToolCall[]) => void
  ): Promise<ToolCall[]> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    // Convert to OpenAI format
    const openAIMessages: OpenAI.Chat.ChatCompletionMessageParam[] = messages.map(msg => {
      if (msg.role === 'system') {
        return { role: 'system', content: msg.content };
      }
      return { role: msg.role, content: msg.content };
    });

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: openAIMessages,
      max_completion_tokens: this.maxTokens,
      tools: tools.length > 0 ? tools as OpenAI.Chat.ChatCompletionTool[] : undefined,
      stream: true,
    });

    const functionCalls: ToolCall[] = [];
    const functionCallsMap: Map<number, ToolCall> = new Map();

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;

      // Stream content
      if (delta?.content) {
        res.write(`data: ${JSON.stringify({ content: delta.content })}\n\n`);
      }

      // Collect tool calls
      if (delta?.tool_calls) {
        for (const toolCall of delta.tool_calls) {
          if (toolCall.index !== undefined) {
            if (!functionCallsMap.has(toolCall.index)) {
              functionCallsMap.set(toolCall.index, {
                id: toolCall.id || '',
                name: toolCall.function?.name || '',
                arguments: '',
              });
            }

            const fc = functionCallsMap.get(toolCall.index)!;
            if (toolCall.id) fc.id = toolCall.id;
            if (toolCall.function?.name) fc.name = toolCall.function.name;
            if (toolCall.function?.arguments) fc.arguments += toolCall.function.arguments;
          }
        }
      }
    }

    // Convert map to array
    functionCallsMap.forEach(fc => {
      console.log(`🔧 OpenAI tool call completed:`, { 
        name: fc.name, 
        arguments: fc.arguments,
        length: fc.arguments.length 
      });
      functionCalls.push(fc);
    });

    if (functionCalls.length > 0 && onToolCall) {
      onToolCall(functionCalls);
    }

    return functionCalls;
  }

  getName(): string {
    return 'OpenAI';
  }
}
