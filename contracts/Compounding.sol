//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import './interfaces/IUniswapV2Router.sol';
import './interfaces/IERC20.sol';
import './interfaces/ILiquidityPool.sol';
import './interfaces/IRewards.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract Compounding is Ownable {
    address immutable UNISWAP_TOKE_ETH_PAIR;
    address immutable TOKE_ETH_LP_TOKEN_STAKE_POOL;
    address immutable REWARDS;
    address immutable ROUTER;
    address immutable TOKE;

    constructor(
        address _UNISWAP_TOKE_ETH_PAIR,
        address _TOKE_ETH_LP_TOKEN_STAKE_POOL,
        address _REWARDS,
        address _ROUTER,
        address _TOKE
    ) Ownable() {
        UNISWAP_TOKE_ETH_PAIR = _UNISWAP_TOKE_ETH_PAIR;
        TOKE_ETH_LP_TOKEN_STAKE_POOL = _TOKE_ETH_LP_TOKEN_STAKE_POOL;
        REWARDS = _REWARDS;
        ROUTER = _ROUTER;
        TOKE = _TOKE;
    }
    
    /**
    * @notice Deposit LP tokens to LP stack pool
    */
    function depositToStakePool() public onlyOwner {
        uint256 amount = IERC20(UNISWAP_TOKE_ETH_PAIR).balanceOf(address(this));
        IERC20(UNISWAP_TOKE_ETH_PAIR).approve(TOKE_ETH_LP_TOKEN_STAKE_POOL, amount);
        ILiquidityPool(TOKE_ETH_LP_TOKEN_STAKE_POOL).deposit(amount);
    }

    /**
    * @notice Claim rewards
    * @param recipient Payload from IPFS
    * @param v Payload from IPFS
    * @param r Payload from IPFS
    * @param s Payload from IPFS
    */
    function claimRewards(
        IRewards.Recipient calldata recipient,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        IRewards(REWARDS).claim(recipient, v, r, s);   
    }

    /**
    * @notice Compound
    * @param recipient Payload from IPFS
    * @param v Payload from IPFS
    * @param r Payload from IPFS
    * @param s Payload from IPFS
    */
    function compound(
        IRewards.Recipient calldata recipient,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        claimRewards(recipient, v, r, s);
        
        uint256 tokeBalance = IERC20(TOKE).balanceOf(address(this));
        IERC20(TOKE).approve(ROUTER, tokeBalance);
        IUniswapV2Router(ROUTER).addLiquidityETH{value: address(this).balance}(TOKE, tokeBalance, tokeBalance, 1, address(this), block.timestamp);
        
        depositToStakePool();
    }

    /**
    * @notice Request withdrawal to withdraw in next cycle
    */
    function requestWithdrawal() public onlyOwner {
        uint256 balance = IERC20(TOKE_ETH_LP_TOKEN_STAKE_POOL).balanceOf(address(this));
        ILiquidityPool(TOKE_ETH_LP_TOKEN_STAKE_POOL).requestWithdrawal(balance);
    }

    /**
    * @notice Withdrawl when the next cycle starts
    */
    function withdraw() public onlyOwner {
        uint256 balance = IERC20(TOKE_ETH_LP_TOKEN_STAKE_POOL).balanceOf(address(this));
        ILiquidityPool(TOKE_ETH_LP_TOKEN_STAKE_POOL).withdraw(balance);
        balance = IERC20(UNISWAP_TOKE_ETH_PAIR).balanceOf(address(this));
        IERC20(UNISWAP_TOKE_ETH_PAIR).transfer(Ownable.owner(), balance);
    }

    receive() external payable {}
}
