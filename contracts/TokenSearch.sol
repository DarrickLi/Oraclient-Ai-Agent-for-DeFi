// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {FunctionsClient} from "@chainlink/contracts@1.4.0/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts@1.4.0/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts@1.4.0/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

/**
 * @title TokenSearch
 * @notice 通过token名字查询avalanche链地址的智能合约
 * @dev 使用Chainlink Functions从CoinGecko API获取token在avalanche链的地址
 */
contract TokenSearch is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    // State variables
    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;
    string public tokenData;

    // Custom error
    error UnexpectedRequestID(bytes32 requestId);

    // Events
    event TokenSearchResponse(
        bytes32 indexed requestId,
        string result,
        bytes response,
        bytes err
    );

    // Router address - Hardcoded for Fuji
    address router = 0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0;

    // JavaScript source code for token search
    string source =
        "const tokenName = args[0];"
        "console.log('Searching token:', tokenName);"
        
        "try {"
            "const searchResponse = await Functions.makeHttpRequest({"
                "url: `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(tokenName)}`,"
                "timeout: 30000"
            "});"
            
            "if (searchResponse.error || searchResponse.status !== 200) {"
                "return Functions.encodeString('search api error');"
            "}"
            
            "const searchData = searchResponse.data;"
            
            "if (!searchData.coins || searchData.coins.length === 0) {"
                "return Functions.encodeString('token not found');"
            "}"
            
            "const tokenId = searchData.coins[0].id;"
            "console.log('Found token ID:', tokenId);"
            
            "const detailResponse = await Functions.makeHttpRequest({"
                "url: `https://api.coingecko.com/api/v3/coins/${tokenId}`,"
                "timeout: 15000"
            "});"
            
            "if (detailResponse.error || detailResponse.status !== 200) {"
                "return Functions.encodeString('detail api error');"
            "}"
            
            "const coinData = detailResponse.data;"
            
            "const avalancheAddress = coinData.platforms?.avalanche;"
            
            "if (!avalancheAddress) {"
                "return Functions.encodeString('no avalanche address found');"
            "}"
            
            "const result = {"
                "token_name: coinData.name,"
                "symbol: coinData.symbol,"
                "avalanche_address: avalancheAddress"
            "};"
            
            "return Functions.encodeString(JSON.stringify(result));"
            
        "} catch (error) {"
            "console.log('Error:', error);"
            "return Functions.encodeString('error: ' + error.message);"
        "}";

    // Callback gas limit
    uint32 gasLimit = 300000;

    // donID - Hardcoded for Fuji
    bytes32 donID = 0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000;

    uint64 private i_subscriptionId;

    /**
     * @notice 初始化合约
     */
    constructor(uint64 subscriptionId) FunctionsClient(router) ConfirmedOwner(msg.sender) {
        i_subscriptionId = subscriptionId;
    }

    /**
     * @notice 发送token搜索请求
     * @param args 参数数组 [tokenName]
     * @return requestId 请求ID
     */
    function sendTokenSearchRequest(
        string[] calldata args
    ) external returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        if (args.length > 0) req.setArgs(args);

        s_lastRequestId = _sendRequest(
            req.encodeCBOR(),
            i_subscriptionId,
            gasLimit,
            donID
        );

        return s_lastRequestId;
    }

    /**
     * @notice Chainlink Functions回调函数
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (s_lastRequestId != requestId) {
            revert UnexpectedRequestID(requestId);
        }
        
        s_lastResponse = response;
        tokenData = string(response);
        s_lastError = err;

        emit TokenSearchResponse(requestId, tokenData, s_lastResponse, s_lastError);
    }

    /**
     * @notice 通过token名字搜索avalanche链地址
     * @param tokenName token名称，如 'USDC', 'Wrapped Bitcoin'
     */
    function searchToken(string calldata tokenName) external returns (bytes32) {
        string[] memory args = new string[](1);
        args[0] = tokenName;
        return sendTokenSearchRequest(args);
    }

    /**
     * @notice 获取最新的token搜索结果
     * @return 搜索结果的JSON字符串
     */
    function getLatestTokenData() external view returns (string memory) {
        return tokenData;
    }

    /**
     * @notice 获取最新请求信息
     */
    function getRequestInfo() external view returns (
        bytes32 lastRequestId,
        bytes memory lastResponse,
        bytes memory lastError
    ) {
        return (s_lastRequestId, s_lastResponse, s_lastError);
    }
} 