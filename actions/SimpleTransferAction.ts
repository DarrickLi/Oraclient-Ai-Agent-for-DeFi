import { formatEther, parseEther, getContract } from "viem";
import { WalletProvider } from "../providers/wallet.ts";
import type { SimpleTransferParams, Transaction } from "../types/index.ts";
import simpleTransferJson from "../artifacts/SimpleTransfer.json" with { type: "json" };

export class SimpleTransferAction {
    constructor(private walletProvider: WalletProvider) {}

    async transfer(params: SimpleTransferParams): Promise<Transaction> {
        const chainName = "avalancheFuji";
        const contractAddress: `0x${string}` = "0x3372690834E2Ee5AFEd3a2eb0cD6F6427C83b54A"; // dev TODO: 填写部署后的合约地址

        if (contractAddress === "0x00") {
            throw new Error("Contract address is not set");
        }

        this.walletProvider.switchChain(chainName);
        const walletClient = this.walletProvider.getWalletClient(chainName);

        try {
            const { abi } = simpleTransferJson["contracts"]["SimpleTransfer.sol:SimpleTransfer"];
            const simpleTransferContract = getContract({
                address: contractAddress,
                abi,
                client: walletClient
            });

            let hash: string;
            if (params.token === "0x00") {
                // AVAX 转账
                hash = await simpleTransferContract.write.transferAvax(
                    [params.to, parseEther(params.amount)],
                    { value: parseEther(params.amount) }
                );
            } else {
                // ERC20 转账
                hash = await simpleTransferContract.write.transferToken(
                    [params.token, params.to, parseEther(params.amount)]
                );
            }

            return {
                hash,
                from: walletClient.account!.address,
                to: contractAddress,
                value: parseEther(params.amount),
                data: "0x",
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Function call failed: ${error.message}`);
            } else {
                throw new Error(`Function call failed: unknown error`);
            }
        }
    }
} 