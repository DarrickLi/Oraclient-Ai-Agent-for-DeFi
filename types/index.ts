export type SimpleTransferParams = {
    token: string; // token 地址，AVAX 则为 0x00
    to: string;    // 接收方地址
    amount: string; // 金额（字符串，单位 ether）
};

export type BasicDEXSwapParams = {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    amountOutMin: string;
    binStep: string;
};

export type GetDeFiDataParams = {
    args: string[]; // [dataType, object]
};

export type GetPriceParams = {
    args: string[]; // [symbol]
};

export type TokenSearchParams = {
    args: string[]; // [tokenName]
}; 