import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { CODE_ASSISTANT_SYSTEM_PROMPT } from './system-prompts.js';
import { mcpClient } from './mcp-client.js';
import { mcpToolsToOpenAIFunctions, formatMCPToolResult } from './openai-tools.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI client
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is not set in environment variables');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// MCP Configuration
const MCP_SERVER_COMMAND = process.env.MCP_SERVER_COMMAND || 'node';
const MCP_SERVER_PATH = process.env.MCP_SERVER_PATH || 'C:\\Users\\chatelin\\projets\\POC_MCP';

// Store MCP tools
let mcpTools: OpenAI.Chat.ChatCompletionTool[] = [];

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequestBody {
  message: string;
  conversationHistory: ChatMessage[];
}

// Chat endpoint with streaming and MCP tool support
app.post('/api/chat', async (req: Request<{}, {}, ChatRequestBody>, res: Response) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Build messages array for OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: CODE_ASSISTANT_SYSTEM_PROMPT,
      },
      // Add conversation history (limited to last 10 messages to manage token usage)
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user',
        content: message,
      },
    ];

    // Process with tool calls loop
    let continueLoop = true;
    let loopCount = 0;
    const maxLoops = 10; // Prevent infinite loops

    while (continueLoop && loopCount < maxLoops) {
      loopCount++;

      // Call OpenAI API with streaming
      const stream = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages,
        max_completion_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '5000'),
        tools: mcpTools.length > 0 ? mcpTools : undefined,
        stream: true,
      });

      let functionCalls: Array<{
        id: string;
        name: string;
        arguments: string;
      }> = [];
      let hasContent = false;

      // Stream the response
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;

        // Handle content streaming
        if (delta?.content) {
          hasContent = true;
          res.write(`data: ${JSON.stringify({ content: delta.content })}\n\n`);
        }

        // Handle tool calls
        if (delta?.tool_calls) {
          for (const toolCall of delta.tool_calls) {
            if (toolCall.index !== undefined) {
              if (!functionCalls[toolCall.index]) {
                functionCalls[toolCall.index] = {
                  id: toolCall.id || '',
                  name: toolCall.function?.name || '',
                  arguments: '',
                };
              }

              if (toolCall.id) {
                functionCalls[toolCall.index].id = toolCall.id;
              }
              if (toolCall.function?.name) {
                functionCalls[toolCall.index].name = toolCall.function.name;
              }
              if (toolCall.function?.arguments) {
                functionCalls[toolCall.index].arguments += toolCall.function.arguments;
              }
            }
          }
        }
      }

      // If there are tool calls, execute them
      if (functionCalls.length > 0) {
        res.write(`data: ${JSON.stringify({ content: '\n\n🔧 Utilisation des outils MCP...\n\n' })}\n\n`);

        // Add assistant message with tool calls
        messages.push({
          role: 'assistant',
          content: null,
          tool_calls: functionCalls.map((fc) => ({
            id: fc.id,
            type: 'function' as const,
            function: {
              name: fc.name,
              arguments: fc.arguments,
            },
          })),
        });

        // Execute each tool call
        for (const fc of functionCalls) {
          try {
            const args = JSON.parse(fc.arguments);
            console.log(`🔧 Executing MCP tool: ${fc.name}`, args);

            // Call MCP tool
            const result = await mcpClient.callTool(fc.name, args);
            const formattedResult = formatMCPToolResult(result);

            // Add tool result to messages
            messages.push({
              role: 'tool',
              tool_call_id: fc.id,
              content: formattedResult,
            });

            res.write(`data: ${JSON.stringify({ content: `✅ Outil ${fc.name} exécuté\n\n` })}\n\n`);
          } catch (error) {
            console.error(`❌ Error executing tool ${fc.name}:`, error);
            messages.push({
              role: 'tool',
              tool_call_id: fc.id,
              content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
          }
        }

        // Continue loop to get final response
        continueLoop = true;
      } else {
        // No tool calls, we're done
        continueLoop = false;
      }
    }

    // Send done signal
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    
    if (error instanceof OpenAI.APIError) {
      res.write(`data: ${JSON.stringify({ error: `OpenAI API error: ${error.message}` })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Internal server error' })}\n\n`);
    }
    
    res.end();
  }
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mcp: {
      connected: mcpClient.isClientConnected(),
      tools: mcpTools.length,
    }
  });
});

// Initialize MCP client on startup
async function initializeMCP() {
  try {
    console.log('🔌 Initializing MCP client...');
    
    await mcpClient.connect(MCP_SERVER_COMMAND, [MCP_SERVER_PATH]);
    
    // List available tools
    const toolsResult = await mcpClient.listTools();
    mcpTools = mcpToolsToOpenAIFunctions(toolsResult.tools);
    
    console.log(`✅ MCP initialized with ${mcpTools.length} tools:`);
    mcpTools.forEach(tool => {
      console.log(`   - ${tool.function.name}: ${tool.function.description}`);
    });
  } catch (error) {
    console.error('❌ Failed to initialize MCP:', error);
    console.log('⚠️  Continuing without MCP support');
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('\n🛑 Shutting down server...');
  await mcpClient.disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server
async function startServer() {
  // Initialize MCP first
  await initializeMCP();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API endpoint: http://localhost:${PORT}/api/chat`);
  });
}

startServer();
