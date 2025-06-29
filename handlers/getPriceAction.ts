import type { Action, HandlerCallback, IAgentRuntime, Memory, State } from "@elizaos/core";
import { initWalletProvider } from "../providers/wallet";
import type { GetPriceParams } from "../types/index.ts";
import { GetPriceAction } from "../actions/GetPriceAction.ts";
import { getPriceTemplate } from "../templates/getPriceTemplate.ts";

const buildFunctionCallDetails = async (
    state: State,
    runtime: IAgentRuntime,
    wp: any
): Promise<GetPriceParams> => {
    // TODO: 实际项目应根据 state/runtime 生成参数
    return {
        args: ["ETH"]
    };
};

export const getPriceAction: Action = {
    name: "get price",
    description: "Call GetPrice contract to fetch price data",
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
        const action = new GetPriceAction(walletProvider);

        const params: GetPriceParams = await buildFunctionCallDetails(
            state,
            runtime,
            walletProvider
        );

        try {
            const callFunctionResp = await action.sendRequest(params);
            if (callback) {
                callback({
                    text: `Successfully requested price for ${params.args[0]}.\nTransaction Hash: ${callFunctionResp.hash}`,
                    content: {
                        success: true,
                        hash: callFunctionResp.hash,
                        symbol: params.args[0],
                        chain: "avalanchefuji",
                    },
                });
            }
            return true;
        } catch (error) {
            if (callback) {
                callback({
                    text: `Error during price request: ${error instanceof Error ? error.message : "unknown error"}`,
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
                    text: "I'll help you get price data",
                    action: "GET_PRICE",
                },
            },
            {
                user: "user",
                content: {
                    text: "Get price for ETH",
                    action: "GET_PRICE",
                },
            },
        ],
    ],
    similes: ["GET_PRICE", "FETCH_PRICE", "PRICE_QUERY"],
}; 