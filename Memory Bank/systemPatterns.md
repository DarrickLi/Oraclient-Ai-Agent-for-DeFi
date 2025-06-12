# 系统模式 (System Patterns)

## 系统架构概览

### 总体架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端Web界面   │    │   ElizaOS Agent │    │   智能合约层    │
│                 │◄──►│                 │◄──►│                 │
│ - 用户交互      │    │ - 自然语言处理  │    │ - Chainlink集成 │
│ - 钱包连接      │    │ - Action执行    │    │ - DeFi操作      │
│ - 数据展示      │    │ - 状态管理      │    │ - 数据查询      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Chainlink网络  │
                    │                 │
                    │ - Price Feeds   │
                    │ - Functions     │
                    │ - 数据验证      │
                    └─────────────────┘
```

## 关键架构决策

### 1. Agent架构模式
**采用ElizaOS Action系统**
- **Action Pattern**: 每个功能作为独立的Action
- **Plugin Architecture**: 模块化插件设计
- **Memory System**: 持久化对话上下文

```typescript
// Action架构示例
interface DeFiAction {
  name: string;
  description: string;
  handler: (runtime: IAgentRuntime, message: Memory) => Promise<boolean>;
  validate: (runtime: IAgentRuntime, message: Memory) => boolean;
  examples: Array<{user: string, content: {text: string}}>
}
```

### 2. 数据层设计模式
**分层数据访问**
```
Application Layer (Agent Actions)
        ↓
Service Layer (Data Services)  
        ↓
Integration Layer (Chainlink/Web3)
        ↓  
Blockchain Layer (Sepolia Network)
```

### 3. 安全架构模式
**非托管安全模式**
- Agent永不持有用户私钥
- 所有交易通过用户钱包签名
- 操作前强制确认机制

## 核心组件设计

### 1. ElizaOS Agent核心
```typescript
// 核心Agent结构
class DeFiAgent {
  // 核心功能Actions
  private actions: Map<string, DeFiAction> = new Map([
    ['price_query', new PriceQueryAction()],
    ['investment_advice', new InvestmentAdviceAction()], 
    ['defi_operation', new DeFiOperationAction()]
  ]);
  
  // Chainlink集成
  private chainlinkService: ChainlinkService;
  
  // Web3连接
  private web3Service: Web3Service;
}
```

### 2. Chainlink集成层
```typescript
// Chainlink服务抽象
interface ChainlinkService {
  // Price Feeds
  getPrice(pair: string): Promise<PriceData>;
  
  // Functions调用
  executeFunction(functionId: string, params: any): Promise<FunctionResult>;
  
  // 数据验证
  validateData(data: any): boolean;
}
```

### 3. Web3操作层
```typescript
// Web3服务接口
interface Web3Service {
  // 连接检查
  checkConnection(): Promise<boolean>;
  
  // 交易构建
  buildTransaction(operation: DeFiOperation): Promise<Transaction>;
  
  // 交易执行（用户签名）
  executeTransaction(tx: Transaction): Promise<TransactionResult>;
}
```

## 数据流模式

### 1. 查询数据流
```
用户@提及 → Agent解析 → Chainlink查询 → 数据验证 → 格式化响应 → 用户反馈
```

### 2. 投资建议流
```
用户请求 → 数据收集 → 多源分析 → AI处理 → 建议生成 → 风险评估 → 用户展示
```

### 3. 链上操作流  
```
用户指令 → 参数解析 → 操作验证 → 交易构建 → 用户确认 → 钱包签名 → 链上执行 → 结果反馈
```

## 错误处理模式

### 1. 分层错误处理
```typescript
// 错误分类
enum ErrorType {
  USER_INPUT_ERROR,    // 用户输入错误
  NETWORK_ERROR,       // 网络连接错误  
  CHAINLINK_ERROR,     // 预言机错误
  CONTRACT_ERROR,      // 合约执行错误
  WALLET_ERROR         // 钱包相关错误
}

// 错误处理策略
class ErrorHandler {
  handle(error: DeFiError): UserResponse {
    switch(error.type) {
      case ErrorType.USER_INPUT_ERROR:
        return this.handleUserError(error);
      case ErrorType.NETWORK_ERROR:
        return this.handleNetworkError(error);
      // ... 其他错误类型
    }
  }
}
```

### 2. 重试机制
- **网络错误**: 指数退避重试
- **Chainlink超时**: 3次重试，最长等待30秒
- **交易失败**: 用户选择是否重试

## 状态管理模式

### 1. Agent状态管理
```typescript
// Agent状态接口
interface AgentState {
  currentUser: string;
  activeOperations: Map<string, Operation>;
  userPreferences: UserPreferences;
  conversationContext: ConversationContext;
}
```

### 2. 操作状态跟踪
```typescript
// 操作状态枚举
enum OperationStatus {
  INITIATED,      // 已启动
  CONFIRMING,     // 等待确认
  EXECUTING,      // 执行中
  COMPLETED,      // 已完成
  FAILED,         // 失败
  CANCELLED       // 已取消
}
```

## 扩展性设计模式

### 1. Plugin系统
```typescript
// Plugin接口
interface DeFiPlugin {
  name: string;
  version: string;
  actions: DeFiAction[];
  
  initialize(agent: DeFiAgent): Promise<void>;
  cleanup(): Promise<void>;
}
```

### 2. 协议适配器模式
```typescript
// DeFi协议适配器
interface ProtocolAdapter {
  protocolName: string;
  supportedOperations: OperationType[];
  
  executeOperation(operation: DeFiOperation): Promise<OperationResult>;
}

// 具体实现示例
class UniswapAdapter implements ProtocolAdapter {
  protocolName = "Uniswap V3";
  supportedOperations = [OperationType.SWAP, OperationType.ADD_LIQUIDITY];
  
  async executeOperation(operation: DeFiOperation): Promise<OperationResult> {
    // Uniswap特定的实现逻辑
  }
}
```

## 性能优化模式

### 1. 缓存策略
```typescript
// 多层缓存架构
interface CacheLayer {
  // L1: 内存缓存（热数据）
  memoryCache: Map<string, CachedData>;
  
  // L2: Redis缓存（温数据）  
  redisCache: RedisClient;
  
  // L3: 数据库缓存（冷数据）
  dbCache: DatabaseClient;
}
```

### 2. 异步处理模式
```typescript
// 异步操作队列
class OperationQueue {
  private queue: Queue<DeFiOperation> = new Queue();
  
  async processOperation(operation: DeFiOperation): Promise<void> {
    // 非阻塞处理
    this.queue.enqueue(operation);
    this.processNext();
  }
}
```

## 监控和日志模式

### 1. 结构化日志
```typescript
// 日志结构
interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: string;
  userId?: string;
  operationId?: string;
  message: string;
  metadata?: any;
}
```

### 2. 指标收集
```typescript
// 性能指标
interface Metrics {
  responseTime: number;
  successRate: number;
  errorRate: number;
  throughput: number;
  userSatisfaction: number;
}
```

## 测试策略模式

### 1. 测试分层
```
E2E Tests (用户场景测试)
    ↓
Integration Tests (组件集成测试)
    ↓  
Unit Tests (单元功能测试)
    ↓
Contract Tests (智能合约测试)
```

### 2. Mock策略
```typescript
// Chainlink Mock服务
class MockChainlinkService implements ChainlinkService {
  async getPrice(pair: string): Promise<PriceData> {
    // 返回模拟价格数据
    return {
      price: "3200.00",
      timestamp: Date.now(),
      confidence: 0.99
    };
  }
}
```

这些系统模式将指导整个项目的技术实现，确保代码的可维护性、可扩展性和性能。 