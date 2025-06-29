import type { Action, HandlerCallback, IAgentRuntime, Memory, State } from "@elizaos/core";
import { initWalletProvider } from "../providers/wallet";
import type { GetDeFiDataParams } from "../types/index.ts";
import { GetDeFiDataAction } from "../actions/GetDeFiDataAction.ts";
import { getDeFiDataTemplate } from "../templates/getDeFiDataTemplate.ts";

const buildFunctionCallDetails = async (
    state: State,
    runtime: IAgentRuntime,
    wp: any
): Promise<GetDeFiDataParams> => {
    // TODO: 实际项目应根据 state/runtime 生成参数
    return {
        args: ["tvl", "ethereum"]
    };
};

export const getDeFiDataAction: Action = {
    name: "get defi data",
    description: "Call GetDeFiData contract to fetch DeFi data",
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
        const action = new GetDeFiDataAction(walletProvider);

        const params: GetDeFiDataParams = await buildFunctionCallDetails(
            state,
            runtime,
            walletProvider
        );

        try {
            const callFunctionResp = await action.sendRequest(params);
            if (callback) {
                callback({
                    text: `Successfully requested DeFi data for ${params.args.join(", ")}.\nTransaction Hash: ${callFunctionResp.hash}`,
                    content: {
                        success: true,
                        hash: callFunctionResp.hash,
                        args: params.args,
                        chain: "avalanchefuji",
                    },
                });
            }
            return true;
        } catch (error) {
            if (callback) {
                callback({
                    text: `Error during DeFi data request: ${error instanceof Error ? error.message : "unknown error"}`,
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
                    text: "I'll help you get DeFi data",
                    action: "GET_DEFI_DATA",
                },
            },
            {
                user: "user",
                content: {
                    text: "Get TVL for ethereum",
                    action: "GET_DEFI_DATA",
                },
            },
        ],
    ],
    similes: ["GET_DEFI_DATA", "FETCH_DEFI", "DEFI_QUERY"],
}; 