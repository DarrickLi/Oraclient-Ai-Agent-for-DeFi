// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {FunctionsClient} from "@chainlink/contracts@1.4.0/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts@1.4.0/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts@1.4.0/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

/**
 * @title GetDeFiData
 * @notice 获取DeFi数据的智能合约，使用Chainlink Functions从DefiLlama API获取数据
 * @dev 支持TVL、稳定币、交易量、费用等数据查询
 */
contract GetDeFiData is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    // State variables to store the last request ID, response, and error
    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;

    // Custom error type
    error UnexpectedRequestID(bytes32 requestId);

    // Event to log responses
    event Response(
        bytes32 indexed requestId,
        string result,
        bytes response,
        bytes err
    );

    // Router address - Hardcoded for Fuji
    address router = 0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0;

    // JavaScript source code
    // 基于defillama-source.js
    string source =
        "const dataType = args[0];"
        "const object = args[1];"
        "console.log('Requesting DeFi data - Type:', dataType, 'Object:', object);"
        
        "let apiUrl;"
        "switch (dataType) {"
            "case 'tvl':"
                "apiUrl = `https://api.llama.fi/tvl/${object}`;"
                "break;"
            "case 'stablecoins':"
                "apiUrl = 'https://stablecoins.llama.fi/stablecoins?includePrices=true';"
                "break;"
            "case 'volumes':"
                "apiUrl = `https://api.llama.fi/summary/dexs/${object}?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`;"
                "break;"
            "case 'fees':"
                "apiUrl = `https://api.llama.fi/summary/fees/${object}?dataType=dailyFees`;"
                "break;"
            "default:"
                "throw new Error(`Unsupported data type: ${dataType}`);"
        "}"
        
        "console.log('Making request to:', apiUrl);"
        "const response = await Functions.makeHttpRequest({"
            "url: apiUrl,"
            "timeout: 30000"
        "});"
        
        "console.log('API Response status:', response.status);"
        "if (response.error || response.status !== 200) {"
            "console.log('API Error:', response.error || `Status ${response.status}`);"
            "return Functions.encodeString('api wrong1');"
        "}"
        
        "if (!response.data) {"
            "console.log('No data in response');"
            "return Functions.encodeString('api wrong2');"
        "}"
        
        "let result;"
        "try {"
            "const data = response.data;"
            "switch (dataType) {"
                "case 'tvl':"
                    "result = {"
                        "datatype: dataType,"
                        "object: object,"
                        "result: data"
                    "};"
                    "break;"
                "case 'stablecoins':"
                    "const peggedAssets = data.peggedAssets || [];"
                    "const stablecoin = peggedAssets.find(coin => "
                        "coin.symbol && coin.symbol.toLowerCase().includes(object.toLowerCase())"
                    ");"
                    "if (!stablecoin) {"
                        "return Functions.encodeString(`Sorry, we can't find the ${dataType} of ${object}`);"
                    "}"
                    "result = {"
                        "datatype: dataType,"
                        "object: object,"
                        "result: {"
                            "price: stablecoin.price || 0,"
                            "circulating: stablecoin.circulating || 0"
                        "}"
                    "};"
                    "break;"
                "case 'volumes':"
                    "result = {"
                        "datatype: dataType,"
                        "object: object,"
                        "result: {"
                            "total24h: data.total24h || 0,"
                            "total48hto24h: data.total48hto24h || 0,"
                            "total7d: data.total7d || 0,"
                            "totalAllTime: data.totalAllTime || 0,"
                            "change_1d: data.change_1d || 0"
                        "}"
                    "};"
                    "break;"
                "case 'fees':"
                    "result = {"
                        "datatype: dataType,"
                        "object: object,"
                        "result: {"
                            "total24h: data.total24h || 0,"
                            "total48hto24h: data.total48hto24h || 0,"
                            "total7d: data.total7d || 0,"
                            "totalAllTime: data.totalAllTime || 0,"
                            "change_1d: data.change_1d || 0"
                        "}"
                    "};"
                    "break;"
                "default:"
                    "return Functions.encodeString('api wrong');"
            "}"
        "} catch (parseError) {"
            "console.log('Data parsing error:', parseError);"
            "return Functions.encodeString('api wrong');"
        "}"
        
        "const resultString = JSON.stringify(result);"
        "console.log('Final result:', resultString);"
        "return Functions.encodeString(resultString);";

    // Callback gas limit
    uint32 gasLimit = 300000;

    // donID - Hardcoded for Fuji
    bytes32 donID = 0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000;

    // State variable to store the returned DeFi data
    string public defiData;
    uint64 private i_subscriptionId;

    /**
     * @notice Initializes the contract with the Chainlink router address and sets the contract owner
     */
    constructor(uint64 subscriptionId) FunctionsClient(router) ConfirmedOwner(msg.sender) {
        i_subscriptionId = subscriptionId;
    }

    /**
     * @notice Sends an HTTP request for DeFi data
     * @param args The arguments to pass to the HTTP request [dataType, object]
     * @return requestId The ID of the request
     */
    function sendRequest(
        string[] calldata args
    ) external returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source); // Initialize the request with JS code
        if (args.length > 0) req.setArgs(args); // Set the arguments for the request

        // Send the request and store the request ID
        s_lastRequestId = _sendRequest(
            req.encodeCBOR(),
            i_subscriptionId,
            gasLimit,
            donID
        );

        return s_lastRequestId;
    }

    /**
     * @notice Callback function for fulfilling a request
     * @param requestId The ID of the request to fulfill
     * @param response The HTTP response data
     * @param err Any errors from the Functions request
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (s_lastRequestId != requestId) {
            revert UnexpectedRequestID(requestId); // Check if request IDs match
        }
        // Update the contract's state variables with the response and any errors
        s_lastResponse = response;
        defiData = string(response);
        s_lastError = err;

        // Emit an event to log the response
        emit Response(requestId, defiData, s_lastResponse, s_lastError);
    }

    /**
     * @notice 获取TVL数据
     * @param object 链名称，如 'ethereum', 'arbitrum'
     */
    function getTVL(string calldata object) external returns (bytes32) {
        string[] memory args = new string[](2);
        args[0] = "tvl";
        args[1] = object;
        return sendRequest(args);
    }

    /**
     * @notice 获取稳定币数据
     * @param object 稳定币symbol，如 'USDC', 'USDT'
     */
    function getStablecoin(string calldata object) external returns (bytes32) {
        string[] memory args = new string[](2);
        args[0] = "stablecoins";
        args[1] = object;
        return sendRequest(args);
    }

    /**
     * @notice 获取DEX交易量数据
     * @param object DEX名称，如 'uniswap', 'pancakeswap'
     */
    function getVolumes(string calldata object) external returns (bytes32) {
        string[] memory args = new string[](2);
        args[0] = "volumes";
        args[1] = object;
        return sendRequest(args);
    }

    /**
     * @notice 获取协议费用数据
     * @param object 协议名称，如 'aave', 'compound'
     */
    function getFees(string calldata object) external returns (bytes32) {
        string[] memory args = new string[](2);
        args[0] = "fees";
        args[1] = object;
        return sendRequest(args);
    }

    /**
     * @notice 获取最新DeFi数据
     */
    function getLatestData() external view returns (string memory) {
        return defiData;
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