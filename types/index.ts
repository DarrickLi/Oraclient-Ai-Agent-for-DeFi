export type SimpleTransferParams = {
    token: string; // token 地址，AVAX 则为 0x00
    to: string;    // 接收方地址
    amount: string; // 金额（字符串，单位 ether）
}; 