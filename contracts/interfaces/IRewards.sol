// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 *  @title Validates and distributes TOKE rewards based on the
 *  the signed and submitted payloads
 */
interface IRewards {
    struct Recipient {
        uint256 chainId;
        uint256 cycle;
        address wallet;
        uint256 amount;
    }

    /// @notice Claim your rewards
    /// @param recipient Published rewards payload
    /// @param v v component of the payload signature
    /// @param r r component of the payload signature
    /// @param s s component of the payload signature
    function claim(
        Recipient calldata recipient,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}