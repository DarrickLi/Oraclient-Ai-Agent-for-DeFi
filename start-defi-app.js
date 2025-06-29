#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// ANSI color codes for colorful output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Serve static files (HTML, CSS, JS, images)
function createStaticServer(port = 8080) {
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    const fullPath = path.join(__dirname, filePath);
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'text/plain';

    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    fs.readFile(fullPath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });

  return server;
}

async function startServices() {
  colorLog('bright', '🚀 Starting Oraclient DeFi Application...\n');

  // Check if dist directory exists
  if (!fs.existsSync('./dist')) {
    colorLog('yellow', '📦 Building project...');
    const buildProcess = spawn('npm', ['run', 'build'], { stdio: 'inherit' });
    
    buildProcess.on('close', (code) => {
      if (code !== 0) {
        colorLog('red', '❌ Build failed');
        process.exit(1);
      }
      startElizaAndWeb();
    });
  } else {
    startElizaAndWeb();
  }
}

function startElizaAndWeb() {
  // Start Eliza API server
  colorLog('cyan', '🤖 Starting Eliza AI Agent...');
  const elizaProcess = spawn('node', ['dist/src/api-server.js'], {
    stdio: ['inherit', 'pipe', 'pipe']
  });

  elizaProcess.stdout.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
      colorLog('blue', `[Eliza] ${message}`);
    }
  });

  elizaProcess.stderr.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
      colorLog('red', `[Eliza Error] ${message}`);
    }
  });

  elizaProcess.on('close', (code) => {
    colorLog('red', `❌ Eliza process exited with code ${code}`);
    process.exit(code);
  });

  // Start static file server
  const staticServer = createStaticServer(8080);
  
  staticServer.listen(8080, () => {
    colorLog('green', '🌐 Web server started on http://localhost:8080');
    colorLog('green', '🤖 Eliza API running on http://localhost:3001');
    colorLog('bright', '\n✨ Application ready! Open http://localhost:8080 in your browser\n');
    
    colorLog('yellow', '📝 Available commands:');
    colorLog('reset', '  • Web Interface: http://localhost:8080');
    colorLog('reset', '  • Eliza API Health: http://localhost:3001/api/health');
    colorLog('reset', '  • Press Ctrl+C to stop all services\n');
  });

  staticServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      colorLog('red', '❌ Port 8080 is already in use. Please close other applications or use a different port.');
    } else {
      colorLog('red', `❌ Static server error: ${err.message}`);
    }
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    colorLog('yellow', '\n🛑 Shutting down services...');
    elizaProcess.kill('SIGTERM');
    staticServer.close(() => {
      colorLog('green', '✅ All services stopped');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    elizaProcess.kill('SIGTERM');
    staticServer.close();
    process.exit(0);
  });
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  colorLog('red', `❌ Uncaught Exception: ${err.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  colorLog('red', `❌ Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Start the application
startServices().catch((err) => {
  colorLog('red', `❌ Failed to start application: ${err.message}`);
  process.exit(1);
}); 