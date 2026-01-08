import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { CODE_ASSISTANT_SYSTEM_PROMPT } from './system-prompts.js';
import { mcpClient } from './mcp-client.js';
import { mcpToolsToOpenAIFunctions, formatMCPToolResult } from './openai-tools.js';
import { LLMProvider, ChatMessage, MCPTool } from './providers/types.js';
import { OpenAIProvider } from './providers/openai-provider.js';
import { AnthropicProvider } from './providers/anthropic-provider.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// LLM Provider configuration
const LLM_PROVIDER = (process.env.LLM_PROVIDER || 'openai').toLowerCase();
let llmProvider: LLMProvider;

// Initialize the selected provider
if (LLM_PROVIDER === 'anthropic' || LLM_PROVIDER === 'claude') {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY is not set in environment variables');
    process.exit(1);
  }
  llmProvider = new AnthropicProvider();
  llmProvider.initialize(process.env.ANTHROPIC_API_KEY, {
    model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
    maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4096'),
  });
} else {
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY is not set in environment variables');
    process.exit(1);
  }
  llmProvider = new OpenAIProvider();
  llmProvider.initialize(process.env.OPENAI_API_KEY, {
    model: process.env.OPENAI_MODEL || 'gpt-4',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '5000'),
  });
}

// MCP Configuration
const MCP_SERVER_COMMAND = process.env.MCP_SERVER_COMMAND || 'node';
const MCP_SERVER_PATH = process.env.MCP_SERVER_PATH || 'C:\\Users\\chatelin\\projets\\POC_MCP';

// Store MCP tools
let mcpTools: MCPTool[] = [];

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

    // Build messages array
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: CODE_ASSISTANT_SYSTEM_PROMPT,
      },
      // Add conversation history (limited to last 10 messages to manage token usage)
      ...conversationHistory.slice(-10),
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

      // Call LLM provider with streaming
      const toolCalls = await llmProvider.streamChat(
        messages,
        mcpTools,
        res
      );

      // If there are tool calls, execute them
      if (toolCalls.length > 0) {
        res.write(`data: ${JSON.stringify({ content: '\n\n🔧 Utilisation des outils MCP...\n\n' })}\n\n`);

        // Add assistant message with tool calls (for conversation history)
        messages.push({
          role: 'assistant',
          content: `[Tool calls: ${toolCalls.map(tc => tc.name).join(', ')}]`,
        });

        // Execute each tool call
        for (const tc of toolCalls) {
          try {
            console.log(`🔧 Tool call received:`, { name: tc.name, arguments: tc.arguments });
            
            // Validate arguments
            if (!tc.arguments || tc.arguments.trim() === '') {
              console.warn(`⚠️  Tool ${tc.name} has empty arguments, using empty object`);
              tc.arguments = '{}';
            }
            
            const args = JSON.parse(tc.arguments);
            console.log(`🔧 Executing MCP tool: ${tc.name}`, args);

            // Call MCP tool
            const result = await mcpClient.callTool(tc.name, args);
            const formattedResult = formatMCPToolResult(result);

            // Add tool result to messages
            messages.push({
              role: 'user',
              content: `[Tool ${tc.name} result: ${formattedResult}]`,
            });

            res.write(`data: ${JSON.stringify({ content: `✅ Outil ${tc.name} exécuté\n\n` })}\n\n`);
          } catch (error) {
            console.error(`❌ Error executing tool ${tc.name}:`, error);
            messages.push({
              role: 'user',
              content: `[Tool ${tc.name} error: ${error instanceof Error ? error.message : 'Unknown error'}]`,
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
    provider: {
      name: llmProvider.getName(),
      model: LLM_PROVIDER === 'anthropic' || LLM_PROVIDER === 'claude' 
        ? process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'
        : process.env.OPENAI_MODEL || 'gpt-4',
    },
    mcp: {
      connected: mcpClient.isClientConnected(),
      tools: mcpTools.map(tool => tool.function.name),
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
