// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {FunctionsClient} from "@chainlink/contracts@1.4.0/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts@1.4.0/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts@1.4.0/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

/**
 * Request testnet LINK and ETH here: https://faucets.chain.link/
 * Find information on LINK Token Contracts and get the latest ETH and LINK faucets here: https://docs.chain.link/resources/link-token-contracts/
 */

/**
 * @title GettingStartedFunctionsConsumer
 * @notice This is an example contract to show how to make HTTP requests using Chainlink
 * @dev This contract uses hardcoded values and should not be used in production.
 */
contract GetPrice is FunctionsClient, ConfirmedOwner {
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
        string price,
        bytes response,
        bytes err
    );

    // Router address - Hardcoded for Sepolia
    // Check to get the router address for your supported network https://docs.chain.link/chainlink-functions/supported-networks
    address router = 0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0;
    // sepolia 0xb83E47C2bC239B3bf370bc41e1459A34b41238D0;

    // JavaScript source code
    // Fetch character name from the Star Wars API.
    // Documentation: https://swapi.info/people
    string source =
        "const symbol = args[0];"
            "const cmcApiKey = 'c7a6fe60-6265-43c5-887a-1bbc0aba2e03';"
            "if (!cmcApiKey) throw new Error('API key not found');"
            "console.log('Requesting price for symbol:', symbol);"
            "const response = await Functions.makeHttpRequest({"
            "url: `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}&convert=USD`,"
            "method: 'GET',"
            "headers: {'X-CMC_PRO_API_KEY': cmcApiKey, 'Accept': 'application/json'},"
            "timeout: 10000"
            "});"
            "console.log('API Response status:', response.status);"
            "if (response.error) {"
            "console.log('API Error:', response.error);"
            "throw new Error(`API failed: ${response.error}`);"
            "}"
            "const data = response.data.data[symbol];"
            "if (!data) {"
            "console.log('Symbol not found in response:', symbol);"
            "throw new Error(`Symbol ${symbol} not found`);"
            "}"
            "const quote = data.quote.USD;"
            "if (!quote) {"
            "console.log('USD quote not found for:', symbol);"
            "throw new Error('USD quote not found');"
            "}"
            "const price = Math.floor(quote.price * 1e18);"
            "const change = Math.floor((quote.percent_change_24h || 0) * 100);"
            "const timestamp = Math.floor(new Date(data.last_updated).getTime() / 1000);"
            "console.log('Parsed data - Price:', price, 'Change:', change, 'Timestamp:', timestamp);"
            "return Functions.encodeString(`${price}`);";

    //Callback gas limit
    uint32 gasLimit = 300000;

    // donID - Hardcoded for Sepolia
    // Check to get the donID for your supported network https://docs.chain.link/chainlink-functions/supported-networks
    bytes32 donID = 0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000;
        
      //sepolia  0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000;

    // State variable to store the returned character information
    string public price;
    uint64 private i_subscriptionId;
    /**
     * @notice Initializes the contract with the Chainlink router address and sets the contract owner
     */
    constructor(uint64 subscriptionId) FunctionsClient(router) ConfirmedOwner(msg.sender) {
        i_subscriptionId = subscriptionId;
    }

    /**
     * @notice Sends an HTTP request for character information
     * @param args The arguments to pass to the HTTP request
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
        price = string(response);
        s_lastError = err;

        // Emit an event to log the response
        emit Response(requestId, price, s_lastResponse, s_lastError);
    }
}
