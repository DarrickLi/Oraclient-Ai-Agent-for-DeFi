// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SimpleTransfer
 * @dev Simple transfer proxy contract supporting AVAX and ERC20 token transfers
 */
contract SimpleTransfer {
    // State variables
    address public owner;
    
    // Events
    event TokenTransfer(address indexed from, address indexed to, address indexed token, uint256 amount);
    event AvaxTransfer(address indexed from, address indexed to, uint256 amount);
    event BatchTransfer(address indexed from, address indexed token, uint256 totalAmount, uint256 recipientCount);
    
    // Modifiers
    modifier validAddress(address _addr) {
        require(_addr != address(0), "Invalid address");
        require(_addr != msg.sender, "Cannot transfer to yourself");
        _;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can execute this operation");
        _;
    }
    
    // Constructor
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Transfer AVAX to specified address
     */
    function transferAvax(address payable _to, uint256 _amount) external payable validAddress(_to) {
        require(_amount > 0, "Transfer amount must be greater than 0");
        require(msg.value >= _amount, "Insufficient AVAX sent");
        _to.transfer(_amount);
        emit AvaxTransfer(msg.sender, _to, _amount);
    }
    
    /**
     * @dev Transfer ERC20 token to specified address using OpenZeppelin IERC20
     */
    function transferToken(address _token, address _to, uint256 _amount) external validAddress(_to) {
        require(_token != address(0), "Invalid token address");
        require(_amount > 0, "Transfer amount must be greater than 0");
        
        IERC20 token = IERC20(_token);
        
        // Check user balance
        require(token.balanceOf(msg.sender) >= _amount, "Insufficient token balance");
        
        // Check allowance
        require(token.allowance(msg.sender, address(this)) >= _amount, "Insufficient allowance");
        
        // Execute transfer
        require(token.transferFrom(msg.sender, _to, _amount), "Token transfer failed");
        
        emit TokenTransfer(msg.sender, _to, _token, _amount);
    }
    
    
    /**
     * @dev Get token balance using OpenZeppelin IERC20
     */
    function getTokenBalance(address _token, address _user) external view returns (uint256) {
        require(_token != address(0), "Invalid token address");
        return IERC20(_token).balanceOf(_user);
    }
    
    /**
     * @dev Get token allowance using OpenZeppelin IERC20
     */
    function getTokenAllowance(address _token, address _user) external view returns (uint256) {
        require(_token != address(0), "Invalid token address");
        return IERC20(_token).allowance(_user, address(this));
    }
    
    /**
     * @dev Get AVAX balance
     */
    function getAvaxBalance(address _user) external view returns (uint256) {
        return _user.balance;
    }
} 