# Oraclient - AI Agent for DeFi

<div align="center">

![Oraclient Logo](logo.png)

**An intelligent DeFi assistant powered by ElizaOS framework**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![ElizaOS](https://img.shields.io/badge/ElizaOS-Latest-blue.svg)](https://github.com/elizaos/eliza)

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [API Reference](#api-reference) • [Development](#development)

</div>

## Overview

Oraclient is an advanced AI-powered DeFi (Decentralized Finance) assistant that combines the power of ElizaOS framework with a modern web interface. It provides users with intelligent assistance for cryptocurrency operations, DeFi protocol interactions, and blockchain analytics.

### 🎯 What makes Oraclient special?

- **AI-Powered Conversations**: Natural language processing for DeFi operations
- **Real-time Data**: Live cryptocurrency prices and DeFi protocol statistics
- **Multi-chain Support**: Works across different blockchain networks
- **User-friendly Interface**: Intuitive web-based dashboard
- **Wallet Integration**: Seamless connection with MetaMask and other wallets
- **Transaction Simulation**: Safe testing environment for DeFi operations

## Features

### 🤖 AI Assistant Capabilities

- **Cryptocurrency Price Queries**: Get real-time prices for BTC, ETH, USDC, and more
- **DeFi Protocol Data**: Access TVL, trading volumes, and fees for major protocols
- **Token Search**: Find token addresses and contract information across networks
- **Trading Assistance**: Help with swaps, liquidity provision, and yield farming
- **Risk Assessment**: Provide warnings and safety recommendations

### 💼 DeFi Operations

- **Token Swapping**: Execute trades across different DEXs
- **Liquidity Management**: Add/remove liquidity from pools
- **Lending & Borrowing**: Interact with protocols like Aave and Compound
- **Yield Farming**: Optimize returns across DeFi protocols
- **Portfolio Tracking**: Monitor balances and positions

### 🌐 Web Interface

- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Live balance updates and transaction status
- **Multi-language Support**: English and Chinese language options
- **Wallet Connection**: Integrate with popular Web3 wallets
- **Transaction History**: Track all your DeFi activities

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/Oraclient-Ai-Agent-for-DeFi.git
   cd Oraclient-Ai-Agent-for-DeFi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm run defi
   ```

4. **Access the application**
   - Web Interface: http://localhost:8080
   - API Health Check: http://localhost:3001/api/health

### Alternative Launch Methods

```bash
# Start only the API server
npm run api:dev

# Start with ElizaOS CLI
npm start

# Build and run
npm run build
npm run api
```

## Project Structure

```
Oraclient-Ai-Agent-for-DeFi/
├── 📁 src/                      # ElizaOS source code
│   ├── 📄 index.ts              # Main agent configuration
│   ├── 📄 plugin.ts             # DeFi-specific plugins and actions
│   └── 📄 api-server.ts         # HTTP API server
├── 📁 actions/                  # Action handlers
│   ├── 📄 GetPriceAction.ts     # Price query actions
│   ├── 📄 GetDeFiDataAction.ts  # DeFi data actions
│   └── 📄 TokenSearchAction.ts  # Token search actions
├── 📁 contracts/                # Smart contracts
├── 📁 handlers/                 # Request handlers
├── 📁 templates/                # Response templates
├── 📁 providers/                # Data providers
├── 📄 index.html                # Web interface
├── 📄 logo.png                  # Application logo
├── 📄 start-defi-app.js         # Launch script
└── 📄 package.json              # Project configuration
```

## API Reference

### Chat Endpoint

Send messages to the AI agent:

```http
POST /api/chat
Content-Type: application/json

{
  "message": "What is the BTC price?",
  "userId": "user123"
}
```

**Response:**
```json
{
  "response": "📈 BTC current price: $107,468 USD\nSource: CoinMarketCap API\nVerified by Chainlink Functions",
  "success": true
}
```

### Health Check

Check API status:

```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "elizaReady": true,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Supported Queries

| Query Type | Example | Response |
|------------|---------|----------|
| Price Check | "What is the BTC price?" | Current BTC price with source |
| DeFi Data | "What is the AAVE TVL?" | Total Value Locked information |
| Token Search | "Search USDC address on Avalanche" | Token contract details |
| Protocol Info | "Show Uniswap volume" | Trading volume statistics |

## Development

### Setting up Development Environment

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development mode**
   ```bash
   npm run dev
   ```

3. **Run tests**
   ```bash
   npm test
   ```

### Building Custom Actions

Create new DeFi actions by extending the base Action interface:

```typescript
import type { Action } from '@elizaos/core';

const customAction: Action = {
  name: 'CUSTOM_DEFI_ACTION',
  similes: ['CUSTOM_TRIGGER'],
  description: 'Description of your action',
  
  validate: async (runtime, message, state) => {
    // Validation logic
    return true;
  },
  
  handler: async (runtime, message, state, options, callback) => {
    // Action implementation
    const response = {
      text: 'Response text',
      actions: ['CUSTOM_DEFI_ACTION']
    };
    await callback(response);
    return response;
  },
  
  examples: [
    // Example conversations
  ]
};
```

### Adding New DeFi Protocols

1. Create action handlers in `actions/`
2. Add protocol-specific logic in `src/plugin.ts`
3. Update the character configuration in `src/index.ts`
4. Add corresponding UI elements in `index.html`

### Environment Variables

Configure your environment:

```env
# Optional: AI Provider Keys
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Optional: Social Platform Integration
DISCORD_API_TOKEN=your_discord_token
TWITTER_API_KEY=your_twitter_key

# Development
NODE_ENV=development
DEBUG=true
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run component tests only
npm run test:component

# Run e2e tests only
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Test Structure

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows

## Deployment

### Production Build

```bash
# Build the project
npm run build

# Start production server
npm run api
```

### Docker Deployment

```dockerfile
# Dockerfile example
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001 8080

CMD ["npm", "run", "defi"]
```

### Environment Setup

Ensure these ports are available:
- `3001`: Eliza API server
- `8080`: Web interface

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests**
   ```bash
   npm test
   ```
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Code Style

- Follow TypeScript best practices
- Use ESLint and Prettier for formatting
- Write tests for new features
- Update documentation as needed

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill processes on ports
npx kill-port 3001
npx kill-port 8080
```

**Build failures:**
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

**AI not responding:**
- Check if the API server is running on port 3001
- Verify the health endpoint: http://localhost:3001/api/health
- Check console for error messages

### Getting Help

- 📚 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/your-username/Oraclient-Ai-Agent-for-DeFi/issues)
- 💬 [Discussions](https://github.com/your-username/Oraclient-Ai-Agent-for-DeFi/discussions)

## Roadmap

### Upcoming Features

- [ ] **Multi-chain Support**: Expand beyond Avalanche
- [ ] **Advanced Analytics**: Portfolio performance tracking
- [ ] **Mobile App**: Native mobile applications
- [ ] **Social Trading**: Copy trading and social features
- [ ] **Advanced AI**: GPT-4 integration and custom models
- [ ] **DeFi Strategies**: Automated yield optimization

### Current Version: v1.0.0

- ✅ Basic AI conversation interface
- ✅ DeFi price and data queries
- ✅ Token search functionality
- ✅ Wallet connection support
- ✅ Multi-language interface

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **ElizaOS Team** - For the amazing AI framework
- **DeFi Community** - For inspiration and feedback
- **Contributors** - For making this project better

---

<div align="center">

**Built with ❤️ by the Oraclient Team**

[Website](https://oraclient.ai) • [Twitter](https://twitter.com/oraclient) • [Discord](https://discord.gg/oraclient)

</div>
