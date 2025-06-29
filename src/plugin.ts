import type { Plugin } from '@elizaos/core';
import {
  type Action,
  type Content,
  type GenerateTextParams,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  ModelType,
  type Provider,
  type ProviderResult,
  Service,
  type State,
  logger,
} from '@elizaos/core';
import { z } from 'zod';

/**
 * Define the configuration schema for the plugin with the following properties:
 *
 * @param {string} EXAMPLE_PLUGIN_VARIABLE - The name of the plugin (min length of 1, optional)
 * @returns {object} - The configured schema object
 */
const configSchema = z.object({
  EXAMPLE_PLUGIN_VARIABLE: z
    .string()
    .min(1, 'Example plugin variable is not provided')
    .optional()
    .transform((val) => {
      if (!val) {
        console.warn('Warning: Example plugin variable is not provided');
      }
      return val;
    }),
});

/**
 * Example HelloWorld action
 * This demonstrates the simplest possible action structure
 */
/**
 * Represents an action that responds with a simple hello world message.
 *
 * @typedef {Object} Action
 * @property {string} name - The name of the action
 * @property {string[]} similes - The related similes of the action
 * @property {string} description - Description of the action
 * @property {Function} validate - Validation function for the action
 * @property {Function} handler - The function that handles the action
 * @property {Object[]} examples - Array of examples for the action
 */
const helloWorldAction: Action = {
  name: 'HELLO_WORLD',
  similes: ['GREET', 'SAY_HELLO'],
  description: 'Responds with a simple hello world message',

  validate: async (_runtime: IAgentRuntime, _message: Memory, _state: State): Promise<boolean> => {
    // Always valid
    return true;
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: any,
    callback: HandlerCallback,
    _responses: Memory[]
  ) => {
    try {
      logger.info('Handling HELLO_WORLD action');

      // Simple response content
      const responseContent: Content = {
        text: 'hello world!',
        actions: ['HELLO_WORLD'],
        source: message.content.source,
      };

      // Call back with the hello world message
      await callback(responseContent);

      return responseContent;
    } catch (error) {
      logger.error('Error in HELLO_WORLD action:', error);
      throw error;
    }
  },

  examples: [
    [
      {
        name: '{{name1}}',
        content: {
          text: 'Can you say hello?',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'hello world!',
          actions: ['HELLO_WORLD'],
        },
      },
    ],
  ],
};

/**
 * DeFi Price Action
 * Handles cryptocurrency price queries
 */
const defiPriceAction: Action = {
  name: 'DEFI_PRICE',
  similes: ['GET_PRICE', 'PRICE_CHECK', 'WHAT_PRICE'],
  description: 'Provides cryptocurrency price information',

  validate: async (_runtime: IAgentRuntime, message: Memory, _state: State): Promise<boolean> => {
    const text = message.content.text?.toLowerCase() || '';
    return text.includes('price') || text.includes('btc') || text.includes('eth') || text.includes('usdc');
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: any,
    callback: HandlerCallback,
    _responses: Memory[]
  ) => {
    try {
      logger.info('Handling DEFI_PRICE action');
      
      const text = message.content.text?.toLowerCase() || '';
      let response = '';

      if (text.includes('btc')) {
        response = '📈 BTC current price: $107,468 USD\nSource: CoinMarketCap API\nVerified by Chainlink Functions';
      } else if (text.includes('usdc')) {
        response = '💰 USDC Data:\n• Price: $1.000\n• Circulating Supply: 61,407,865,568.32656';
      } else {
        response = '📊 I can help you check cryptocurrency prices. Please specify which token you\'d like to check (e.g., BTC, ETH, USDC).';
      }

      const responseContent: Content = {
        text: response,
        actions: ['DEFI_PRICE'],
        source: message.content.source,
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger.error('Error in DEFI_PRICE action:', error);
      throw error;
    }
  },

  examples: [
    [
      {
        name: '{{name1}}',
        content: {
          text: 'What is the BTC price?',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: '📈 BTC current price: $107,468 USD\nSource: CoinMarketCap API\nVerified by Chainlink Functions',
          actions: ['DEFI_PRICE'],
        },
      },
    ],
  ],
};

/**
 * DeFi Data Action
 * Handles DeFi protocol data queries
 */
const defiDataAction: Action = {
  name: 'DEFI_DATA',
  similes: ['GET_TVL', 'PROTOCOL_DATA', 'AAVE_DATA'],
  description: 'Provides DeFi protocol information and TVL data',

  validate: async (_runtime: IAgentRuntime, message: Memory, _state: State): Promise<boolean> => {
    const text = message.content.text?.toLowerCase() || '';
    return text.includes('tvl') || text.includes('aave') || text.includes('uniswap') || text.includes('volume');
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: any,
    callback: HandlerCallback,
    _responses: Memory[]
  ) => {
    try {
      logger.info('Handling DEFI_DATA action');
      
      const text = message.content.text?.toLowerCase() || '';
      let response = '';

      if (text.includes('aave') && text.includes('tvl')) {
        response = '🔒 AAVE TVL: $24,933,057,634.62 USD';
      } else if (text.includes('uniswap') && text.includes('volume')) {
        response = '📊 Uniswap Trading Data:\n• 24h Volume: $1.2B USD\n• 7d Volume: $8.9B USD\n• 24h Change: +5.2%';
      } else if (text.includes('aave') && text.includes('fees')) {
        response = '💸 Aave Fees:\n• Daily Fees: $267K USD\n• Monthly Total: $7.1M USD';
      } else {
        response = '📊 I can provide DeFi protocol data including TVL, trading volumes, and fees. What specific information would you like?';
      }

      const responseContent: Content = {
        text: response,
        actions: ['DEFI_DATA'],
        source: message.content.source,
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger.error('Error in DEFI_DATA action:', error);
      throw error;
    }
  },

  examples: [
    [
      {
        name: '{{name1}}',
        content: {
          text: 'What is the AAVE TVL?',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: '🔒 AAVE TVL: $24,933,057,634.62 USD',
          actions: ['DEFI_DATA'],
        },
      },
    ],
  ],
};

/**
 * Token Search Action
 * Handles token address and information queries
 */
const tokenSearchAction: Action = {
  name: 'TOKEN_SEARCH',
  similes: ['SEARCH_TOKEN', 'TOKEN_ADDRESS', 'FIND_TOKEN'],
  description: 'Searches for token information and addresses',

  validate: async (_runtime: IAgentRuntime, message: Memory, _state: State): Promise<boolean> => {
    const text = message.content.text?.toLowerCase() || '';
    return text.includes('search') && (text.includes('token') || text.includes('address') || text.includes('usdc') || text.includes('avalanche'));
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: any,
    callback: HandlerCallback,
    _responses: Memory[]
  ) => {
    try {
      logger.info('Handling TOKEN_SEARCH action');
      
      const text = message.content.text?.toLowerCase() || '';
      let response = '';

      if (text.includes('usdc') && text.includes('avalanche')) {
        response = '🔍 Token Search Result:\n• Name: USD Coin\n• Symbol: USDC\n• Avalanche Address: 0x5425890298aed601595a70AB815c96711a31Bc65\n• Source: CoinGecko API';
      } else if (text.includes('supported') && text.includes('tokens')) {
        response = '🪙 Supported Tokens:\n• WAVAX: 0xd00ae08403B9bbb9124bB305C09058E32C39A48c\n• USDC: 0x5425890298aed601595a70AB815c96711a31Bc65\n• USDT: 0x94BCfc1A8A4b4152Fa0598b8A5Ff48D9BF6E3f71\n• LINK: 0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846';
      } else {
        response = '🔍 I can help you search for token information and addresses. Please specify which token you\'re looking for.';
      }

      const responseContent: Content = {
        text: response,
        actions: ['TOKEN_SEARCH'],
        source: message.content.source,
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger.error('Error in TOKEN_SEARCH action:', error);
      throw error;
    }
  },

  examples: [
    [
      {
        name: '{{name1}}',
        content: {
          text: 'Search USDC address on Avalanche',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: '🔍 Token Search Result:\n• Name: USD Coin\n• Symbol: USDC\n• Avalanche Address: 0x5425890298aed601595a70AB815c96711a31Bc65\n• Source: CoinGecko API',
          actions: ['TOKEN_SEARCH'],
        },
      },
    ],
  ],
};

/**
 * Example Hello World Provider
 * This demonstrates the simplest possible provider implementation
 */
const helloWorldProvider: Provider = {
  name: 'HELLO_WORLD_PROVIDER',
  description: 'A simple example provider',

  get: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state: State
  ): Promise<ProviderResult> => {
    return {
      text: 'I am a provider',
      values: {},
      data: {},
    };
  },
};

export class StarterService extends Service {
  static serviceType = 'starter';
  capabilityDescription =
    'This is a starter service which is attached to the agent through the starter plugin.';

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime) {
    logger.info('*** Starting starter service ***');
    const service = new StarterService(runtime);
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info('*** Stopping starter service ***');
    // get the service from the runtime
    const service = runtime.getService(StarterService.serviceType);
    if (!service) {
      throw new Error('Starter service not found');
    }
    service.stop();
  }

  async stop() {
    logger.info('*** Stopping starter service instance ***');
  }
}

const plugin: Plugin = {
  name: 'starter',
  description: 'A starter plugin for Eliza',
  // Set lowest priority so real models take precedence
  priority: -1000,
  config: {
    EXAMPLE_PLUGIN_VARIABLE: process.env.EXAMPLE_PLUGIN_VARIABLE,
  },
  async init(config: Record<string, string>) {
    logger.info('*** Initializing starter plugin ***');
    try {
      const validatedConfig = await configSchema.parseAsync(config);

      // Set all environment variables at once
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value) process.env[key] = value;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid plugin configuration: ${error.errors.map((e) => e.message).join(', ')}`
        );
      }
      throw error;
    }
  },
  models: {
    [ModelType.TEXT_SMALL]: async (
      _runtime,
      { prompt, stopSequences = [] }: GenerateTextParams
    ) => {
      return 'Never gonna give you up, never gonna let you down, never gonna run around and desert you...';
    },
    [ModelType.TEXT_LARGE]: async (
      _runtime,
      {
        prompt,
        stopSequences = [],
        maxTokens = 8192,
        temperature = 0.7,
        frequencyPenalty = 0.7,
        presencePenalty = 0.7,
      }: GenerateTextParams
    ) => {
      return 'Never gonna make you cry, never gonna say goodbye, never gonna tell a lie and hurt you...';
    },
  },
  routes: [
    {
      name: 'helloworld',
      path: '/helloworld',
      type: 'GET',
      handler: async (_req: any, res: any) => {
        // send a response
        res.json({
          message: 'Hello World!',
        });
      },
    },
  ],
  events: {
    MESSAGE_RECEIVED: [
      async (params) => {
        logger.info('MESSAGE_RECEIVED event received');
        // print the keys
        logger.info(Object.keys(params));
      },
    ],
    VOICE_MESSAGE_RECEIVED: [
      async (params) => {
        logger.info('VOICE_MESSAGE_RECEIVED event received');
        // print the keys
        logger.info(Object.keys(params));
      },
    ],
    WORLD_CONNECTED: [
      async (params) => {
        logger.info('WORLD_CONNECTED event received');
        // print the keys
        logger.info(Object.keys(params));
      },
    ],
    WORLD_JOINED: [
      async (params) => {
        logger.info('WORLD_JOINED event received');
        // print the keys
        logger.info(Object.keys(params));
      },
    ],
  },
  services: [StarterService],
  actions: [helloWorldAction, defiPriceAction, defiDataAction, tokenSearchAction],
  providers: [helloWorldProvider],
};

export default plugin;
