import { createServer } from 'http';
import { URL } from 'url';
import type { IAgentRuntime } from '@elizaos/core';
import { AgentRuntime, elizaLogger } from '@elizaos/core';
import project from './index.js';

interface ChatMessage {
  text: string;
  sender: 'user' | 'ai';
  timestamp?: string;
}

interface ChatRequest {
  message: string;
  userId?: string;
}

interface ChatResponse {
  response: string;
  success: boolean;
  error?: string;
}

let runtime: IAgentRuntime | null = null;

// Initialize Eliza runtime
async function initializeEliza() {
  try {
    elizaLogger.info('Initializing Eliza runtime...');
    
    // Create runtime with the first agent from the project
    runtime = new AgentRuntime({
      agentConfig: project.agents[0].character,
      serverUrl: 'http://localhost:3000',
      token: 'local-development',
      databaseAdapter: undefined, // Will use default in-memory adapter
    });

    // Initialize the agent
    await project.agents[0].init?.(runtime);
    
    elizaLogger.info('Eliza runtime initialized successfully');
    return runtime;
  } catch (error) {
    elizaLogger.error('Failed to initialize Eliza:', error);
    throw error;
  }
}

// Handle chat requests
async function handleChat(req: any, res: any) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const chatRequest: ChatRequest = JSON.parse(body);
        
        if (!chatRequest.message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Message is required', success: false }));
          return;
        }

        if (!runtime) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Eliza runtime not initialized', success: false }));
          return;
        }

        // Create a message for Eliza
        const message = {
          userId: chatRequest.userId || 'web-user',
          agentId: runtime.agentId,
          content: {
            text: chatRequest.message,
            source: 'web-frontend'
          },
          roomId: 'web-chat',
        };

        elizaLogger.info('Processing message:', chatRequest.message);

        // Process the message with Eliza
        const response = await runtime.processActions(message);
        
        let responseText = 'I understand your request, but I need more information to help you properly.';
        
        if (response && response.length > 0) {
          // Get the first response that has text content
          const textResponse = response.find(r => r.content?.text);
          if (textResponse?.content?.text) {
            responseText = textResponse.content.text;
          }
        }

        const chatResponse: ChatResponse = {
          response: responseText,
          success: true
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(chatResponse));

      } catch (parseError) {
        elizaLogger.error('Error parsing request:', parseError);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON', success: false }));
      }
    });

  } catch (error) {
    elizaLogger.error('Error handling chat request:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error', success: false }));
  }
}

// CORS headers
function setCorsHeaders(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Create HTTP server
export function createApiServer(port: number = 3001) {
  const server = createServer(async (req, res) => {
    setCorsHeaders(res);

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    switch (url.pathname) {
      case '/api/chat':
        await handleChat(req, res);
        break;
      
      case '/api/health':
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'ok', 
          elizaReady: runtime !== null,
          timestamp: new Date().toISOString()
        }));
        break;

      default:
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
        break;
    }
  });

  return server;
}

// Start the API server
export async function startApiServer(port: number = 3001) {
  try {
    // Initialize Eliza first
    await initializeEliza();
    
    // Create and start the server
    const server = createApiServer(port);
    
    server.listen(port, () => {
      elizaLogger.info(`API server running on http://localhost:${port}`);
      elizaLogger.info('Available endpoints:');
      elizaLogger.info('  POST /api/chat - Send messages to Eliza');
      elizaLogger.info('  GET /api/health - Check server status');
    });

    return server;
  } catch (error) {
    elizaLogger.error('Failed to start API server:', error);
    throw error;
  }
}

// If this file is run directly, start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  startApiServer().catch(console.error);
} 