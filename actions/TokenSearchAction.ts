import { getContract } from "viem";
import { WalletProvider } from "../providers/wallet.ts";
import type { TokenSearchParams, Transaction } from "../types/index.ts";
import tokenSearchJson from "../artifacts/TokenSearch.json" with { type: "json" };

export class TokenSearchAction {
    constructor(private walletProvider: WalletProvider) {}

    async sendTokenSearchRequest(params: TokenSearchParams): Promise<Transaction> {
        const chainName = "avalancheFuji";
        const contractAddress: `0x${string}` = "0x17594F73ACC6A705730373Ca40e60d3ec1Ac5ba3"; // TODO: 填写部署后的合约地址

        this.walletProvider.switchChain(chainName);
        const walletClient = this.walletProvider.getWalletClient(chainName);

        const { abi } = tokenSearchJson["contracts"]["TokenSearch.sol:TokenSearch"];
        const contract = getContract({
            address: contractAddress,
            abi,
            client: walletClient
        });

        const hash = await contract.write.sendTokenSearchRequest([params.args]);
        return {
            hash,
            from: walletClient.account!.address,
            to: contractAddress,
            value: 0n,
            data: "0x",
        };
    }
} 