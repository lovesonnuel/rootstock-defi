pragma solidity ^0.8.24;

contract RSKAtomicSwap {
    struct Swap {
        bytes32 secretHash;
        uint256 expiry;
        address initiator;
        uint256 amount;
    }

    mapping(bytes32 => Swap) public swaps;

    function initiateSwap(bytes32 secretHash, uint256 expiry) external payable {
        swaps[secretHash] = Swap(secretHash, expiry, msg.sender, msg.value);
    }

    function redeem(bytes32 secret) external {
        bytes32 secretHash = keccak256(abi.encodePacked(secret));
        Swap memory swap = swaps[secretHash];
        require(block.timestamp < swap.expiry, "Swap expired");
        payable(msg.sender).transfer(swap.amount);
    }
}