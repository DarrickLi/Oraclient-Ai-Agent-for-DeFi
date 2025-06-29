import { getContract } from "viem";
import { WalletProvider } from "../providers/wallet.ts";
import type { GetPriceParams, Transaction } from "../types/index.ts";
import getPriceJson from "../artifacts/GetPrice.json" with { type: "json" };

export class GetPriceAction {
    constructor(private walletProvider: WalletProvider) {}

    async sendRequest(params: GetPriceParams): Promise<Transaction> {
        const chainName = "avalancheFuji";
        const contractAddress: `0x${string}` = "0x8412F626cDa0d361810A9A93B1e0d6d601dbb9af"; // TODO: 填写部署后的合约地址

        this.walletProvider.switchChain(chainName);
        const walletClient = this.walletProvider.getWalletClient(chainName);

        const { abi } = getPriceJson["contracts"]["GetPrice.sol:GetPrice"];
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