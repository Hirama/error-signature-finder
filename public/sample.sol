// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract ErrorSample {
    // Custom errors
    error Unauthorized(address caller);
    error InsufficientBalance(uint256 available, uint256 required);
    error InvalidInput(string reason);
    error TransferFailed();
    error DeadlineExpired(uint256 deadline, uint256 currentTime);
    error NonExistentItem(uint256 itemId);

    address public owner;
    mapping(address => uint256) public balances;

    constructor() {
        owner = msg.sender;
    }

    function withdraw(uint256 amount) external {
        if (msg.sender != owner) {
            revert Unauthorized(msg.sender);
        }

        if (balances[msg.sender] < amount) {
            revert InsufficientBalance(balances[msg.sender], amount);
        }

        balances[msg.sender] -= amount;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) {
            revert TransferFailed();
        }
    }

    function checkDeadline(uint256 deadline) external view {
        if (block.timestamp > deadline) {
            revert DeadlineExpired(deadline, block.timestamp);
        }
    }

    function getItem(uint256 itemId) external pure {
        if (itemId > 100) {
            revert NonExistentItem(itemId);
        }
    }
} 