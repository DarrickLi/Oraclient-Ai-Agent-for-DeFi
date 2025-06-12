# 项目简介 (Project Brief)

## 项目概述

**项目名称**: DeFi AI Agent  
**项目类型**: 基于ElizaOS的去中心化金融AI助手  
**开发语言**: JavaScript/TypeScript + Solidity  
**目标网络**: 以太坊Sepolia测试网  

## 核心目标

创建一个智能DeFi助手，通过自然语言交互帮助用户：
1. 查询链上数据（通过@agent方式）
2. 获得基于数据的投资建议
3. 执行链上金融操作

## 关键特性

### 功能特性
- **链上数据查询**: 用户可以@agent查询各种DeFi相关数据
- **投资建议**: 基于用户指定方向提供数据驱动的建议
- **链上操作**: 代理执行用户授权的金融操作

### 技术特性
- **AI框架**: ai16z ElizaOS
- **预言机**: Chainlink Price Feeds & Functions
- **用户交互**: 自然语言@提及方式
- **资产安全**: 非托管模式，用户控制钱包

## 项目约束

### 技术约束
- 必须使用ElizaOS框架
- 必须集成Chainlink预言机
- 部署在Sepolia测试网
- 用户钱包连接（MetaMask等）

### 功能约束
- 非托管模式，不持有用户资产
- 所有操作需用户明确授权
- 测试网环境，不涉及真实资产

## 成功标准

### 最小可行产品(MVP)
- [ ] 基础agent可以响应@提及
- [ ] 能查询基本链上数据（如代币价格）
- [ ] 能提供简单投资建议
- [ ] 能执行基础链上操作（如token swap）

### 完整产品目标
- [ ] 支持多种数据查询类型
- [ ] 智能投资建议算法
- [ ] 完整的DeFi操作套件
- [ ] 用户友好的Web界面

## 参考资源

- **参考项目**: [QingyangKong/Eliza-Twitter-Chainlink-Functions](https://github.com/QingyangKong/Eliza-Twitter-Chainlink-Functions#)
- **ElizaOS文档**: [ai16z/eliza](https://github.com/ai16z/eliza)
- **Chainlink文档**: [docs.chain.link](https://docs.chain.link/)

## 项目范围

### 包含内容
- ElizaOS agent开发
- Chainlink集成
- 基础智能合约
- 前端Web界面
- Sepolia测试网部署

### 不包含内容
- 主网部署
- 复杂的DeFi协议开发
- 真实资产管理
- 移动端应用 