import Anthropic from '@anthropic-ai/sdk';
import { Response } from 'express';
import { LLMProvider, ChatMessage, MCPTool, ToolCall } from './types.js';

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic | null = null;
  private model: string = 'claude-3-5-sonnet-20241022';
  private maxTokens: number = 4096;

  initialize(apiKey: string, config: Record<string, unknown>): void {
    this.client = new Anthropic({ apiKey });
    this.model = (config.model as string) || 'claude-3-5-sonnet-20241022';
    this.maxTokens = (config.maxTokens as number) || 4096;
    console.log(`✅ Anthropic provider initialized with model: ${this.model}`);
  }

  async streamChat(
    messages: ChatMessage[],
    tools: MCPTool[],
    res: Response,
    onToolCall?: (toolCalls: ToolCall[]) => void
  ): Promise<ToolCall[]> {
    if (!this.client) {
      throw new Error('Anthropic client not initialized');
    }

    // Extract system message
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    
    // Convert to Anthropic format (without system messages in the array)
    const anthropicMessages: Anthropic.MessageParam[] = messages
      .filter(m => m.role !== 'system')
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    // Convert MCP tools to Anthropic format
    const anthropicTools: Anthropic.Tool[] = tools.map(tool => ({
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters as Anthropic.Tool.InputSchema,
    }));

    const stream = await this.client.messages.stream({
      model: this.model,
      max_tokens: this.maxTokens,
      system: systemMessage,
      messages: anthropicMessages,
      tools: anthropicTools.length > 0 ? anthropicTools : undefined,
    });

    const toolCalls: ToolCall[] = [];
    let currentToolUse: { id: string; name: string; input: string } | null = null;

    for await (const event of stream) {
      // Handle content blocks
      if (event.type === 'content_block_start') {
        const block = event.content_block;
        
        if (block.type === 'tool_use') {
          currentToolUse = {
            id: block.id,
            name: block.name,
            input: '',
          };
          console.log(`🔧 Anthropic tool use started:`, { id: block.id, name: block.name });
        }
      }

      // Handle content deltas
      if (event.type === 'content_block_delta') {
        const delta = event.delta;
        
        if (delta.type === 'text_delta') {
          // Stream text content
          res.write(`data: ${JSON.stringify({ content: delta.text })}\n\n`);
        } else if (delta.type === 'input_json_delta' && currentToolUse) {
          // Accumulate tool input
          currentToolUse.input += delta.partial_json;
          console.log(`🔧 Accumulating tool input:`, { partial: delta.partial_json, total: currentToolUse.input });
        }
      }

      // Handle content block end
      if (event.type === 'content_block_stop') {
        if (currentToolUse) {
          console.log(`🔧 Anthropic tool use completed:`, { 
            name: currentToolUse.name, 
            input: currentToolUse.input,
            length: currentToolUse.input.length 
          });
          toolCalls.push({
            id: currentToolUse.id,
            name: currentToolUse.name,
            arguments: currentToolUse.input,
          });
          currentToolUse = null;
        }
      }
    }

    if (toolCalls.length > 0 && onToolCall) {
      onToolCall(toolCalls);
    }

    return toolCalls;
  }

  getName(): string {
    return 'Anthropic';
  }
}
