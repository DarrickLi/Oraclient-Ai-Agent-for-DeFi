import { Action, composeContext, generateObjectDeprecated, HandlerCallback, ModelClass, type State, type IAgentRuntime, type Memory } from "@elizaos/core";
import { initWalletProvider } from "../providers/wallet";
import type { SimpleTransferParams } from "../types/index.ts";
import { SimpleTransferAction } from "../actions/SimpleTransferAction";
import { simpleTransferTemplate } from "../templates/simpleTransferTemplate";

const buildFunctionCallDetails = async (
    state: State,
    runtime: IAgentRuntime,
    wp: any
): Promise<SimpleTransferParams> => {
    const context = composeContext({
        state,
        template: simpleTransferTemplate,
    });

    const functionCallDetails = (await generateObjectDeprecated({
        runtime,
        context,
        modelClass: ModelClass.SMALL,
    })) as SimpleTransferParams;

    return functionCallDetails;
};

export const simpleTransferAction: Action = {
    name: "simple transfer",
    description: "Transfer AVAX or ERC20 token using SimpleTransfer contract",
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
        const action = new SimpleTransferAction(walletProvider);

        const transferParams: SimpleTransferParams = await buildFunctionCallDetails(
            state,
            runtime,
            walletProvider
        );

        try {
            const callFunctionResp = await action.transfer(transferParams);
            if (callback) {
                callback({
                    text: `Successfully transferred ${transferParams.amount} to ${transferParams.to}\nTransaction Hash: ${callFunctionResp.hash}`,
                    content: {
                        success: true,
                        hash: callFunctionResp.hash,
                        amount: callFunctionResp.value.toString(),
                        recipient: transferParams.to,
                        chain: "avalanchefuji",
                    },
                });
            }
            return true;
        } catch (error) {
            if (callback) {
                callback({
                    text: `Error during transfer: ${error instanceof Error ? error.message : "unknown error"}`,
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
                    text: "I'll help you transfer AVAX or ERC20 token",
                    action: "SIMPLE_TRANSFER",
                },
            },
            {
                user: "user",
                content: {
                    text: "Send 1 AVAX to 0x1234567890123456789012345678901234567890",
                    action: "SIMPLE_TRANSFER",
                },
            },
            {
                user: "user",
                content: {
                    text: "Send 10 USDT to 0x1234567890123456789012345678901234567890",
                    action: "SIMPLE_TRANSFER",
                },
            },
        ],
    ],
    similes: ["SIMPLE_TRANSFER", "TRANSFER", "SEND_TOKEN"],
}; 