# 技术上下文 (Tech Context)

## 技术栈概览

### 核心技术栈
```
┌─────────────────────────────────────────────────────────────┐
│                     DeFi AI Agent Tech Stack                │
├─────────────────────────────────────────────────────────────┤
│ AI Framework    │ ElizaOS (ai16z)                          │
│ Language        │ TypeScript/JavaScript                    │
│ Blockchain      │ Ethereum Sepolia Testnet                │
│ Smart Contracts │ Solidity ^0.8.0                         │
│ Oracle          │ Chainlink (Price Feeds + Functions)     │
│ Frontend        │ React/Next.js (待定)                     │
│ Web3 Library    │ ethers.js v6                            │
│ Package Manager │ pnpm                                     │
└─────────────────────────────────────────────────────────────┘
```

## ElizaOS技术细节

### 框架版本和依赖
```json
{
  "dependencies": {
    "@ai16z/eliza": "^0.1.x",
    "@elizaos/core": "^0.1.x", 
    "@elizaos/adapter-web": "^0.1.x",
    "ethers": "^6.8.0",
    "@chainlink/functions-toolkit": "^0.2.x"
  }
}
```

### ElizaOS架构集成
```typescript
// 基础Agent配置
export const agentConfig = {
  name: "DeFi Agent",
  description: "智能DeFi助手，支持链上数据查询、投资建议和DeFi操作",
  personality: "专业、可靠、用户友好的DeFi专家",
  
  // 核心能力
  actions: [
    'PRICE_QUERY',
    'INVESTMENT_ADVICE', 
    'DEFI_OPERATION',
    'WALLET_ANALYSIS'
  ],
  
  // 提供者配置
  providers: [
    'chainlink',
    'web3',
    'memory'
  ]
};
```

### Action系统架构
```typescript
// Action接口定义
interface DeFiAction extends Action {
  name: string;
  similes: string[];
  description: string;
  
  // 验证逻辑
  validate(runtime: IAgentRuntime, message: Memory): boolean;
  
  // 处理逻辑
  handler(runtime: IAgentRuntime, message: Memory): Promise<boolean>;
  
  // 示例对话
  examples: Array<{
    user: string;
    content: { text: string; };
  }>;
}
```

## Chainlink技术集成

### Price Feeds配置
```typescript
// Sepolia测试网Price Feed地址
export const PRICE_FEEDS = {
  'ETH/USD': '0x694AA1769357215DE4FAC081bf1f309aDC325306',
  'BTC/USD': '0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43',
  'LINK/USD': '0xc59E3633BAAC79493d908e63626716e204A45EdF',
  'USDC/USD': '0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E'
};

// Price Feed接口
interface PriceFeed {
  getLatestPrice(): Promise<{
    price: bigint;
    decimals: number;
    timestamp: number;
  }>;
}
```

### Chainlink Functions配置
```typescript
// Functions配置
export const CHAINLINK_FUNCTIONS = {
  subscriptionId: process.env.CHAINLINK_SUBSCRIPTION_ID,
  donId: 'fun-ethereum-sepolia-1',
  gatewayUrls: [
    'https://01.functions-gateway.testnet.chain.link/',
    'https://02.functions-gateway.testnet.chain.link/'
  ]
};

// Functions JavaScript代码示例
const functionsSource = `
// 获取DeFi协议数据
const response = await Functions.makeHttpRequest({
  url: 'https://api.defillama.com/protocol/uniswap',
  method: 'GET'
});

return Functions.encodeString(JSON.stringify(response.data));
`;
```

## Web3技术栈

### 以太坊集成
```typescript
// Web3提供者配置
export const web3Config = {
  network: {
    name: 'sepolia',
    chainId: 11155111,
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/',
  },
  
  // 合约地址（部署后更新）
  contracts: {
    defiAgent: process.env.DEFI_AGENT_CONTRACT,
    priceOracle: process.env.PRICE_ORACLE_CONTRACT,
  }
};

// ethers.js提供者
export const provider = new ethers.JsonRpcProvider(web3Config.network.rpcUrl);
```

### 钱包连接架构
```typescript
// 钱包连接接口
interface WalletConnection {
  address: string;
  chainId: number;
  connected: boolean;
  
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  signTransaction(tx: Transaction): Promise<string>;
}

// MetaMask集成
class MetaMaskWallet implements WalletConnection {
  async connect(): Promise<void> {
    if (typeof window.ethereum !== 'undefined') {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    }
  }
}
```

## 智能合约技术架构

### 合约结构
```solidity
// 主要合约架构
contract DeFiAgent {
    // Chainlink集成
    AggregatorV3Interface internal priceFeed;
    
    // 用户操作追踪
    mapping(address => UserData) public users;
    
    // 事件定义
    event OperationExecuted(address user, string operation, uint256 amount);
    event PriceQueried(string pair, int256 price, uint256 timestamp);
    
    // 核心功能
    function queryPrice(string memory pair) external view returns (int256);
    function executeSwap(address tokenA, address tokenB, uint256 amount) external;
    function getInvestmentAdvice(string memory strategy) external view returns (string memory);
}
```

### 安全模式
```solidity
// 安全修饰符
modifier onlyAuthorizedUser() {
    require(authorizedUsers[msg.sender], "Unauthorized");
    _;
}

modifier validAmount(uint256 amount) {
    require(amount > 0 && amount <= maxTransactionAmount, "Invalid amount");
    _;
}

// 重入攻击保护
modifier nonReentrant() {
    require(!locked, "Reentrant call");
    locked = true;
    _;
    locked = false;
}
```

## 开发环境配置

### 开发工具
```json
{
  "devDependencies": {
    "@types/node": "^20.x",
    "typescript": "^5.x",
    "hardhat": "^2.19.0",
    "@nomicfoundation/hardhat-toolbox": "^4.0.0",
    "dotenv": "^16.3.0",
    "eslint": "^8.x",
    "prettier": "^3.x"
  }
}
```

### 环境变量
```bash
# .env.example
# Blockchain配置
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key

# Chainlink配置  
CHAINLINK_SUBSCRIPTION_ID=your_subscription_id
CHAINLINK_PRIVATE_KEY=your_chainlink_private_key

# ElizaOS配置
ELIZA_LOG_LEVEL=debug
ELIZA_DATABASE_URL=sqlite://./data/eliza.db

# 可选：外部API
DEFILLAMA_API_KEY=optional_api_key
COINGECKO_API_KEY=optional_api_key
```

### 项目结构
```
defi-ai-agent/
├── src/
│   ├── actions/           # ElizaOS Actions
│   │   ├── priceQuery.ts
│   │   ├── investmentAdvice.ts
│   │   └── defiOperation.ts
│   ├── services/          # 服务层
│   │   ├── chainlink.ts
│   │   ├── web3.ts
│   │   └── defi.ts
│   ├── contracts/         # 智能合约
│   │   ├── DeFiAgent.sol
│   │   └── PriceOracle.sol
│   ├── frontend/          # 前端代码
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/
│   └── types/             # 类型定义
│       └── index.ts
├── scripts/               # 部署脚本
├── test/                  # 测试文件
├── hardhat.config.ts      # Hardhat配置
├── package.json
└── tsconfig.json
```

## 部署架构

### 测试网部署流程
```typescript
// 部署脚本示例
async function deployContracts() {
  // 1. 部署价格预言机合约
  const PriceOracle = await ethers.getContractFactory("PriceOracle");
  const priceOracle = await PriceOracle.deploy(PRICE_FEEDS['ETH/USD']);
  
  // 2. 部署主合约
  const DeFiAgent = await ethers.getContractFactory("DeFiAgent");
  const defiAgent = await DeFiAgent.deploy(
    priceOracle.address,
    CHAINLINK_FUNCTIONS.subscriptionId
  );
  
  console.log("Contracts deployed:", {
    priceOracle: priceOracle.address,
    defiAgent: defiAgent.address
  });
}
```

### 前端部署
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build", 
    "start": "next start",
    "deploy": "vercel deploy --prod"
  }
}
```

## 技术约束和限制

### 网络限制
- **测试网限制**: Sepolia测试网的稳定性和性能限制
- **Gas限制**: 测试网Gas价格波动和区块确认时间
- **Faucet限制**: 测试ETH获取限制

### ElizaOS约束
- **框架成熟度**: ElizaOS是相对新的框架，文档和社区支持有限
- **插件生态**: 第三方插件较少，需要自己开发大部分功能
- **性能限制**: 对话处理和状态管理的性能边界

### Chainlink限制
- **Functions限制**: 
  - 执行时间限制（10秒）
  - 返回数据大小限制（256KB）
  - 请求频率限制
- **Price Feed限制**: 
  - 更新频率限制
  - 支持的交易对有限

## 监控和调试

### 日志配置
```typescript
// 日志系统配置
export const logConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: 'json',
  destinations: [
    'console',
    'file://logs/agent.log'
  ],
  
  // 结构化日志
  fields: {
    timestamp: true,
    level: true,
    module: true,
    userId: true,
    operationId: true
  }
};
```

### 性能监控
```typescript
// 性能监控指标
interface PerformanceMetrics {
  responseTime: number;      // 平均响应时间
  throughput: number;        // 每秒处理请求数
  errorRate: number;         // 错误率
  chainlinkLatency: number;  // Chainlink调用延迟
  web3Latency: number;       // Web3调用延迟
}
```

这个技术上下文文档将作为整个开发过程的技术指南，确保所有技术决策都与项目架构保持一致。 