import { getContract, parseEther } from "viem";
import { WalletProvider } from "../providers/wallet";
import type { BasicDEXSwapParams, Transaction } from "../types/index.ts";
import basicDEXOperationsJson from "../artifacts/BasicDEXOperations.json" with { type: "json" };

export class BasicDEXOperationsAction {
    constructor(private walletProvider: WalletProvider) {}

    async swapTokens(params: BasicDEXSwapParams): Promise<Transaction> {
        const chainName = "avalancheFuji";
        const contractAddress: `0x${string}` = "0x859655f001BE2E9EBcECd6C2f933b2c931722393"; // TODO: 填写部署后的合约地址

        this.walletProvider.switchChain(chainName);
        const walletClient = this.walletProvider.getWalletClient(chainName);

        const { abi } = basicDEXOperationsJson["contracts"]["BasicDEXOperations.sol:BasicDEXOperations"];
        const contract = getContract({
            address: contractAddress,
            abi,
            client: walletClient
        });

        const hash = await contract.write.swapTokens([
            params.tokenIn,
            params.tokenOut,
            parseEther(params.amountIn),
            parseEther(params.amountOutMin),
            parseEther(params.binStep)
        ]);
        return {
            hash,
            from: walletClient.account!.address,
            to: contractAddress,
            value: parseEther("0"),
            data: "0x",
        };
    }
} 