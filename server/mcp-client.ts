import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ListToolsResult, CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export class MCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private isConnected = false;

  async connect(command: string, args: string[]): Promise<void> {
    if (this.isConnected) {
      console.log('MCP client already connected');
      return;
    }

    try {
      console.log(`🔌 Connecting to MCP server: ${command} ${args.join(' ')}`);
      
      // Create transport
      this.transport = new StdioClientTransport({
        command,
        args,
      });

      // Create client
      this.client = new Client(
        {
          name: 'chatbot-mcp-consumer',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      // Connect
      await this.client.connect(this.transport);
      this.isConnected = true;

      console.log('✅ MCP client connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect to MCP server:', error);
      throw error;
    }
  }

  async listTools(): Promise<ListToolsResult> {
    if (!this.client || !this.isConnected) {
      throw new Error('MCP client not connected');
    }

    try {
      const result = await this.client.listTools();
      console.log(`📋 Listed ${result.tools.length} tools from MCP server`);
      return result;
    } catch (error) {
      console.error('❌ Failed to list MCP tools:', error);
      throw error;
    }
  }

  async callTool(name: string, args: Record<string, unknown>) {
    if (!this.client || !this.isConnected) {
      throw new Error('MCP client not connected');
    }

    try {
      console.log(`🔧 Calling MCP tool: ${name}`);
      const result = await this.client.callTool({
        name,
        arguments: args,
      });
      console.log(`✅ MCP tool ${name} executed successfully`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to call MCP tool ${name}:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      if (this.client) {
        await this.client.close();
      }
      this.isConnected = false;
      console.log('🔌 MCP client disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting MCP client:', error);
    }
  }

  isClientConnected(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
export const mcpClient = new MCPClient();
