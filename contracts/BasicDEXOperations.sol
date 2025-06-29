// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Trader Joe V2 路由器接口 (V2.2)
interface ILBRouter {
    enum Version {
        V1,
        V2,
        V2_1,
        V2_2
    }

    struct Path {
        uint256[] pairBinSteps;
        Version[] versions;
        IERC20[] tokenPath;
    }

    struct LiquidityParameters {
        IERC20 tokenX;
        IERC20 tokenY;
        uint256 binStep;
        uint256 amountX;
        uint256 amountY;
        uint256 amountXMin;
        uint256 amountYMin;
        uint256 activeIdDesired;
        uint256 idSlippage;
        int256[] deltaIds;
        uint256[] distributionX;
        uint256[] distributionY;
        address to;
        address refundTo;
        uint256 deadline;
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        Path memory path,
        address to,
        uint256 deadline
    ) external returns (uint256 amountOut);

    function swapExactNATIVEForTokens(
        uint256 amountOutMin,
        Path memory path,
        address to,
        uint256 deadline
    ) external payable returns (uint256 amountOut);

    function swapExactTokensForNATIVE(
        uint256 amountIn,
        uint256 amountOutMin,
        Path memory path,
        address to,
        uint256 deadline
    ) external returns (uint256 amountOut);

    function addLiquidity(
        LiquidityParameters calldata liquidityParameters
    ) external returns (
        uint256 amountXAdded,
        uint256 amountYAdded,
        uint256 amountXLeft,
        uint256 amountYLeft,
        uint256[] memory depositIds,
        uint256[] memory liquidityMinted
    );
}

// Trader Joe V2 工厂接口
interface ILBFactory {
    struct LBPairInformation {
        uint16 binStep;
        ILBPair LBPair;
        bool createdByOwner;
        bool ignoredForRouting;
    }

    function getLBPairInformation(
        IERC20 tokenX,
        IERC20 tokenY,
        uint256 binStep
    ) external view returns (LBPairInformation memory);
}

// Trader Joe V2 配对接口
interface ILBPair {
    function getActiveId() external view returns (uint24);
    function getBin(uint24 id) external view returns (uint256 reserveX, uint256 reserveY);
    function getTokenX() external view returns (IERC20);
    function getTokenY() external view returns (IERC20);
    function getSwapOut(uint128 amountIn, bool swapForY) 
        external view returns (uint128 amountInLeft, uint128 amountOut, uint128 fee);
}

/**
 * @title BasicDEXOperations
 * @notice 基础DEX操作合约，直接集成Trader Joe V2协议
 * @dev 支持代币交换、流动性操作和价格查询
 */
contract BasicDEXOperations is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // 合约状态变量
    ILBRouter public immutable router;
    ILBFactory public immutable factory;
    
    // Fuji测试网代币地址
    address public constant WAVAX = 0xd00ae08403B9bbb9124bB305C09058E32C39A48c;
    address public constant USDC = 0x5425890298aed601595a70AB815c96711a31Bc65;
    address public constant USDT = 0x94BCfc1A8A4b4152Fa0598b8A5Ff48D9BF6E3f71;
    // 只保留在Fuji测试网可用的代币
    address public constant LINK = 0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846;

    // 事件定义
    event TokenSwap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    event LiquidityAdded(
        address indexed user,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256[] liquidityMinted
    );

    event LiquidityRemoved(
        address indexed user,
        address indexed tokenA,
        address indexed tokenB,
        uint256[] liquidityBurned
    );

    /**
     * @notice 合约构造函数
     * @dev 自动配置Fuji测试网的Trader Joe V2地址，部署者自动成为所有者
     */
    constructor() Ownable(msg.sender) {
        // Fuji测试网固定地址 (V2.2 最新版本)
        router = ILBRouter(0x18556DA13313f3532c54711497A8FedAC273220E);   // Trader Joe V2.2 Router
        factory = ILBFactory(0xb43120c4745967fa9b93E79C149E66B0f2D6Fe0c);  // Trader Joe V2.2 Factory
    }

    /**
     * @notice 执行代币交换操作
     * @param tokenIn 输入代币地址 (address(0) = AVAX)
     * @param tokenOut 输出代币地址 (address(0) = AVAX)
     * @param amountIn 输入代币数量 (AVAX交换时忽略，使用msg.value)
     * @param amountOutMin 最小输出数量（滑点保护，测试时可设为0）
     * @param binStep Bin步长 (推荐: 25=0.25%, 50=0.50%, 100=1.00%)
     * @return amountOut 实际输出数量
     */
    function swapTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 binStep
    ) external payable nonReentrant returns (uint256 amountOut) {
        require(tokenIn != tokenOut, "Cannot swap same token");

        // 处理AVAX交换
        if (tokenIn == address(0)) {
            require(msg.value > 0, "Must send AVAX");
            return _swapAVAXForTokens(tokenOut, amountOutMin, binStep);
        } else if (tokenOut == address(0)) {
            require(amountIn > 0, "Amount must be greater than 0");
            return _swapTokensForAVAX(tokenIn, amountIn, amountOutMin, binStep);
        } else {
            require(amountIn > 0, "Amount must be greater than 0");
            return _swapTokensForTokens(tokenIn, tokenOut, amountIn, amountOutMin, binStep);
        }
    }

    /**
     * @notice AVAX换代币
     */
    function _swapAVAXForTokens(
        address tokenOut,
        uint256 amountOutMin,
        uint256 binStep
    ) internal returns (uint256 amountOut) {
        require(msg.value > 0, "Must send AVAX");

        // 构建交换路径
        IERC20[] memory tokenPath = new IERC20[](2);
        tokenPath[0] = IERC20(WAVAX);
        tokenPath[1] = IERC20(tokenOut);

        uint256[] memory pairBinSteps = new uint256[](1);
        pairBinSteps[0] = binStep;

        ILBRouter.Version[] memory versions = new ILBRouter.Version[](1);
        versions[0] = ILBRouter.Version.V2_2;

        ILBRouter.Path memory path = ILBRouter.Path({
            pairBinSteps: pairBinSteps,
            versions: versions,
            tokenPath: tokenPath
        });

        // 执行交换
        amountOut = router.swapExactNATIVEForTokens{value: msg.value}(
            amountOutMin,
            path,
            msg.sender,
            block.timestamp + 300
        );

        emit TokenSwap(msg.sender, address(0), tokenOut, msg.value, amountOut);
    }

    /**
     * @notice 代币换AVAX
     */
    function _swapTokensForAVAX(
        address tokenIn,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 binStep
    ) internal returns (uint256 amountOut) {
        // 转入代币
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenIn).forceApprove(address(router), amountIn);

        // 构建交换路径
        IERC20[] memory tokenPath = new IERC20[](2);
        tokenPath[0] = IERC20(tokenIn);
        tokenPath[1] = IERC20(WAVAX);

        uint256[] memory pairBinSteps = new uint256[](1);
        pairBinSteps[0] = binStep;

        ILBRouter.Version[] memory versions = new ILBRouter.Version[](1);
        versions[0] = ILBRouter.Version.V2_2;

        ILBRouter.Path memory path = ILBRouter.Path({
            pairBinSteps: pairBinSteps,
            versions: versions,
            tokenPath: tokenPath
        });

        // 执行交换
        amountOut = router.swapExactTokensForNATIVE(
            amountIn,
            amountOutMin,
            path,
            msg.sender,
            block.timestamp + 300
        );

        emit TokenSwap(msg.sender, tokenIn, address(0), amountIn, amountOut);
    }

    /**
     * @notice 代币换代币
     */
    function _swapTokensForTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 binStep
    ) internal returns (uint256 amountOut) {
        // 转入代币
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenIn).forceApprove(address(router), amountIn);

        // 构建交换路径
        IERC20[] memory tokenPath = new IERC20[](2);
        tokenPath[0] = IERC20(tokenIn);
        tokenPath[1] = IERC20(tokenOut);

        uint256[] memory pairBinSteps = new uint256[](1);
        pairBinSteps[0] = binStep;

        ILBRouter.Version[] memory versions = new ILBRouter.Version[](1);
        versions[0] = ILBRouter.Version.V2_2;

        ILBRouter.Path memory path = ILBRouter.Path({
            pairBinSteps: pairBinSteps,
            versions: versions,
            tokenPath: tokenPath
        });

        // 执行交换
        amountOut = router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            msg.sender,
            block.timestamp + 300
        );

        emit TokenSwap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }

    /**
     * @notice 添加流动性
     * @param tokenA 代币A地址
     * @param tokenB 代币B地址
     * @param amountA 代币A数量
     * @param amountB 代币B数量
     * @param binStep Bin步长
     * @param activeIdDesired 期望的活跃ID
     * @param idSlippage ID滑点
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 binStep,
        uint256 activeIdDesired,
        uint256 idSlippage
    ) external nonReentrant returns (
        uint256 amountXAdded,
        uint256 amountYAdded,
        uint256[] memory liquidityMinted
    ) {
        require(amountA > 0 && amountB > 0, "Amounts must be greater than 0");

        // 转入代币
        IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountB);

        // 批准路由器使用代币
        IERC20(tokenA).forceApprove(address(router), amountA);
        IERC20(tokenB).forceApprove(address(router), amountB);

        // 设置流动性参数
        int256[] memory deltaIds = new int256[](1);
        deltaIds[0] = 0;

        uint256[] memory distributionX = new uint256[](1);
        uint256[] memory distributionY = new uint256[](1);
        distributionX[0] = 1000000; // 100% 分配
        distributionY[0] = 1000000; // 100% 分配

        ILBRouter.LiquidityParameters memory liquidityParams = ILBRouter.LiquidityParameters({
            tokenX: IERC20(tokenA),
            tokenY: IERC20(tokenB),
            binStep: binStep,
            amountX: amountA,
            amountY: amountB,
            amountXMin: amountA * 95 / 100, // 5% 滑点保护
            amountYMin: amountB * 95 / 100, // 5% 滑点保护
            activeIdDesired: activeIdDesired,
            idSlippage: idSlippage,
            deltaIds: deltaIds,
            distributionX: distributionX,
            distributionY: distributionY,
            to: msg.sender,
            refundTo: msg.sender,
            deadline: block.timestamp + 300
        });

        // 添加流动性
        (amountXAdded, amountYAdded, , , , liquidityMinted) = router.addLiquidity(liquidityParams);

        emit LiquidityAdded(msg.sender, tokenA, tokenB, amountXAdded, amountYAdded, liquidityMinted);
    }

    /**
     * @notice 获取交换预估输出
     * @param tokenIn 输入代币地址
     * @param tokenOut 输出代币地址
     * @param amountIn 输入数量
     * @param binStep Bin步长
     * @return amountOut 预估输出数量
     */
    function getSwapQuote(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 binStep
    ) external view returns (uint256 amountOut) {
        // 获取配对信息
        ILBFactory.LBPairInformation memory pairInfo = factory.getLBPairInformation(
            IERC20(tokenIn),
            IERC20(tokenOut),
            binStep
        );

        require(address(pairInfo.LBPair) != address(0), "Pair does not exist");

        // 确定交换方向
        bool swapForY = pairInfo.LBPair.getTokenX() == IERC20(tokenIn);

        // 获取预估输出
        (, amountOut, ) = pairInfo.LBPair.getSwapOut(uint128(amountIn), swapForY);
    }

    /**
     * @notice 获取配对信息
     * @param tokenA 代币A地址
     * @param tokenB 代币B地址
     * @param binStep Bin步长
     * @return lbPair 配对地址
     * @return activeId 活跃ID
     * @return reserveX X代币储备量
     * @return reserveY Y代币储备量
     */
    function getPairInfo(
        address tokenA,
        address tokenB,
        uint256 binStep
    ) external view returns (
        address lbPair,
        uint24 activeId,
        uint256 reserveX,
        uint256 reserveY
    ) {
        // 获取配对信息
        ILBFactory.LBPairInformation memory pairInfo = factory.getLBPairInformation(
            IERC20(tokenA),
            IERC20(tokenB),
            binStep
        );

        lbPair = address(pairInfo.LBPair);

        if (lbPair != address(0)) {
            activeId = pairInfo.LBPair.getActiveId();
            (reserveX, reserveY) = pairInfo.LBPair.getBin(activeId);
        }
    }

    /**
     * @notice 获取支持的代币列表
     * @return tokens 代币地址数组
     * @return symbols 代币符号数组
     */
    function getSupportedTokens() external pure returns (
        address[] memory tokens,
        string[] memory symbols
    ) {
        tokens = new address[](4);
        symbols = new string[](4);

        tokens[0] = WAVAX;
        symbols[0] = "WAVAX";

        tokens[1] = USDC;
        symbols[1] = "USDC";

        tokens[2] = USDT;
        symbols[2] = "USDT";

        tokens[3] = LINK;
        symbols[3] = "LINK";
    }

    /**
     * @notice 紧急提取代币
     * @param token 代币地址
     * @param amount 提取数量
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    /**
     * @notice 接收AVAX
     */
    receive() external payable {}
} 