import type { Action, HandlerCallback, IAgentRuntime, Memory, State } from "@elizaos/core";
import { initWalletProvider } from "../providers/wallet";
import type { TokenSearchParams } from "../types/index.ts";
import { TokenSearchAction } from "../actions/TokenSearchAction.ts";
import { tokenSearchTemplate } from "../templates/tokenSearchTemplate.ts";

const buildFunctionCallDetails = async (
    state: State,
    runtime: IAgentRuntime,
    wp: any
): Promise<TokenSearchParams> => {
    // TODO: 实际项目应根据 state/runtime 生成参数
    return {
        args: ["USDC"]
    };
};

export const tokenSearchAction: Action = {
    name: "token search",
    description: "Call TokenSearch contract to search token address",
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
        const action = new TokenSearchAction(walletProvider);

        const params: TokenSearchParams = await buildFunctionCallDetails(
            state,
            runtime,
            walletProvider
        );

        try {
            const callFunctionResp = await action.sendTokenSearchRequest(params);
            if (callback) {
                callback({
                    text: `Successfully searched token: ${params.args[0]}.\nTransaction Hash: ${callFunctionResp.hash}`,
                    content: {
                        success: true,
                        hash: callFunctionResp.hash,
                        token: params.args[0],
                        chain: "avalanchefuji",
                    },
                });
            }
            return true;
        } catch (error) {
            if (callback) {
                callback({
                    text: `Error during token search: ${error instanceof Error ? error.message : "unknown error"}`,
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
                    text: "I'll help you search token address",
                    action: "TOKEN_SEARCH",
                },
            },
            {
                user: "user",
                content: {
                    text: "Search token address for USDC",
                    action: "TOKEN_SEARCH",
                },
            },
        ],
    ],
    similes: ["TOKEN_SEARCH", "SEARCH_TOKEN", "FIND_TOKEN"],
}; 