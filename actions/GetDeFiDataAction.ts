import { getContract } from "viem";
import { WalletProvider } from "../providers/wallet.ts";
import type { GetDeFiDataParams, Transaction } from "../types/index.ts";
import getDeFiDataJson from "../artifacts/GetDeFiData.json" with { type: "json" };

export class GetDeFiDataAction {
    constructor(private walletProvider: WalletProvider) {}

    async sendRequest(params: GetDeFiDataParams): Promise<Transaction> {
        const chainName = "avalancheFuji";
        const contractAddress: `0x${string}` = "0x38b285A853d7b13B3F67054430E14962C77a11Da"; // TODO: 填写部署后的合约地址

        this.walletProvider.switchChain(chainName);
        const walletClient = this.walletProvider.getWalletClient(chainName);

        const { abi } = getDeFiDataJson["contracts"]["GetDeFiData.sol:GetDeFiData"];
        const contract = getContract({
            address: contractAddress,
            abi,
            client: walletClient
        });

        const hash = await contract.write.sendRequest([params.args]);
        return {
            hash,
            from: walletClient.account!.address,
            to: contractAddress,
            value: 0n,
            data: "0x",
        };
    }
} 