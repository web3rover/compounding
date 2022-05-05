// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IRewards.sol";
import "../interfaces/IERC20.sol";

contract MockRewards is IRewards {  
    address immutable TOKE;

    constructor(address _TOKE) {
        TOKE = _TOKE;
    }

    function claim(
        Recipient calldata recipient,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override {
        IERC20(TOKE).transfer(address(recipient.wallet), recipient.amount);
    }
}