import { Tool } from '@modelcontextprotocol/sdk/types.js';
import OpenAI from 'openai';

/**
 * Convert MCP tool schema to OpenAI function definition
 */
export function mcpToolToOpenAIFunction(mcpTool: Tool): OpenAI.Chat.ChatCompletionTool {
  return {
    type: 'function',
    function: {
      name: mcpTool.name,
      description: mcpTool.description || `Tool: ${mcpTool.name}`,
      parameters: mcpTool.inputSchema as Record<string, unknown>,
    },
  };
}

/**
 * Convert multiple MCP tools to OpenAI functions
 */
export function mcpToolsToOpenAIFunctions(mcpTools: Tool[]): OpenAI.Chat.ChatCompletionTool[] {
  return mcpTools.map(mcpToolToOpenAIFunction);
}

/**
 * Format MCP tool result for OpenAI
 */
export function formatMCPToolResult(result: { content: Array<{ type: string; text?: string }> }): string {
  // Extract text content from MCP result
  const textContent = result.content
    .filter(item => item.type === 'text' && item.text)
    .map(item => item.text)
    .join('\n');

  return textContent || JSON.stringify(result);
}
