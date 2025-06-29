import type { Action, HandlerCallback, IAgentRuntime, Memory, State } from "@elizaos/core";
import { initWalletProvider } from "../providers/wallet";
import type { BasicDEXSwapParams } from "../types/index.ts";
import { BasicDEXOperationsAction } from "../actions/BasicDEXOperationsAction.ts";
import { basicDEXOperationsTemplate } from "../templates/basicDEXOperationsTemplate.ts";

const buildFunctionCallDetails = async (
    state: State,
    runtime: IAgentRuntime,
    wp: any
): Promise<BasicDEXSwapParams> => {
    // TODO: 实际项目应根据 state/runtime 生成参数
    return {
        tokenIn: "0x00",
        tokenOut: "0x00",
        amountIn: "1.0",
        amountOutMin: "0.9",
        binStep: "25"
    };
};

export const basicDEXOperationsAction: Action = {
    name: "basic dex swap",
    description: "Swap tokens using BasicDEXOperations contract",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        _options?: any,
        callback?: HandlerCallback
    ) => {
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        const walletProvider = await initWalletProvider(runtime);
        const action = new BasicDEXOperationsAction(walletProvider);

        const swapParams: BasicDEXSwapParams = await buildFunctionCallDetails(
            state,
            runtime,
            walletProvider
        );

        try {
            const callFunctionResp = await action.swapTokens(swapParams);
            if (callback) {
                callback({
                    text: `Successfully swapped ${swapParams.amountIn} from ${swapParams.tokenIn} to ${swapParams.tokenOut}\nTransaction Hash: ${callFunctionResp.hash}`,
                    content: {
                        success: true,
                        hash: callFunctionResp.hash,
                        amount: swapParams.amountIn,
                        recipient: swapParams.tokenOut,
                        chain: "avalanchefuji",
                    },
                });
            }
            return true;
        } catch (error) {
            if (callback) {
                callback({
                    text: `Error during swap: ${error instanceof Error ? error.message : "unknown error"}`,
                    content: { error: error instanceof Error ? error.message : "unknown error" },
                });
            }
            return false;
        }
    },
    validate: async (runtime: IAgentRuntime) => {
        const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.startsWith("0x");
    },
    examples: [
        [
            {
                user: "assistant",
                content: {
                    text: "I'll help you swap tokens on DEX",
                    action: "BASIC_DEX_SWAP",
                },
            },
            {
                user: "user",
                content: {
                    text: "Swap 1 AVAX to USDC",
                    action: "BASIC_DEX_SWAP",
                },
            },
        ],
    ],
    similes: ["BASIC_DEX_SWAP", "DEX_SWAP", "SWAP_TOKENS"],
}; 