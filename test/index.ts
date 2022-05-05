import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { ethers, network } from "hardhat";
import { Compounding, IERC20, IERC20__factory, IManager__factory, MockRewards } from "../typechain";

const UNISWAP_FACTORY = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
const UNISWAP_ROUTER = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
const TOKE = '0x2e9d63788249371f1DFC918a52f8d799F4a38C94'
const TOKE_FAUCET = '0x23a5efe19aa966388e132077d733672cf5798c03'
const UNISWAP_TOKE_ETH_PAIR = '0x5Fa464CEfe8901d66C09b85d5Fcdc55b3738c688'
const UNISWAP_TOKE_ETH_PAIR_FAUCET = '0x7ac049b7d78bc930e463709ec5e77855a5dca4c4'
const TOKE_ETH_LP_TOKEN_STAKE_POOL = '0x1b429e75369ea5cd84421c1cc182cee5f3192fd3'
const REWARDS_OWNER = '0x9e0bce7ec474b481492610eb9dd5d69eb03718d5'
const WITHDRAWAL_CYCLE_MANAGER = '0xa86e412109f77c45a3bc1c5870b880492fb86a14'
const WITHDRAWAL_CYCLE_MANAGER_ADMIN = '0x9e0bce7ec474b481492610eb9dd5d69eb03718d5'

let user:SignerWithAddress;
let compounding: Compounding;
let uniswapPairContract:IERC20;
let mockRewards:MockRewards;

describe('Compounding', async function () {
  before(async function () {
    const MockRewards = await ethers.getContractFactory('MockRewards');
    mockRewards = await MockRewards.deploy(TOKE);
    await mockRewards.deployed();

    const Compounding = await ethers.getContractFactory('Compounding');
    compounding = await Compounding.deploy(
      UNISWAP_TOKE_ETH_PAIR, 
      TOKE_ETH_LP_TOKEN_STAKE_POOL, 
      mockRewards.address,
      UNISWAP_ROUTER,
      TOKE
    );

    await compounding.deployed();

    const accounts = await ethers.getSigners();
    user = accounts[0]

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [UNISWAP_TOKE_ETH_PAIR_FAUCET],
    });

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [TOKE_FAUCET],
    });

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [WITHDRAWAL_CYCLE_MANAGER_ADMIN],
    });

    await user.sendTransaction({
      to: UNISWAP_TOKE_ETH_PAIR_FAUCET,
      value: ethers.utils.parseEther('100'),
    })

    await user.sendTransaction({
      to: TOKE_FAUCET,
      value: ethers.utils.parseEther('100'),
    })

    await user.sendTransaction({
      to: compounding.address,
      value: ethers.utils.parseEther('100'),
    })

    uniswapPairContract = await IERC20__factory.connect(UNISWAP_TOKE_ETH_PAIR, await ethers.getSigner(UNISWAP_TOKE_ETH_PAIR_FAUCET));

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [REWARDS_OWNER],
    });
  });

  it('deposit tokens to Uni LP token pool', async function () {
    await uniswapPairContract.transfer(compounding.address, ethers.utils.parseEther('100'));
    expect(await uniswapPairContract.balanceOf(compounding.address)).equal(ethers.utils.parseEther('100'))

    expect(await (await IERC20__factory.connect(TOKE_ETH_LP_TOKEN_STAKE_POOL, user)).balanceOf(compounding.address)).equal('0')

    await compounding.depositToStakePool()
    expect(await (await IERC20__factory.connect(TOKE_ETH_LP_TOKEN_STAKE_POOL, user)).balanceOf(compounding.address)).equal(ethers.utils.parseEther('100'))
  });

  it('should get rewards', async function () {
    const toke = await IERC20__factory.connect(TOKE, await ethers.getSigner(TOKE_FAUCET))
    await toke.transfer(mockRewards.address, ethers.utils.parseEther('10000'))

    expect(await (await IERC20__factory.connect(TOKE, user)).balanceOf(mockRewards.address)).equal(ethers.utils.parseEther('10000'))

    await compounding.claimRewards({amount: parseEther('1'), cycle: 0, wallet: compounding.address, chainId: 1}, 100, ethers.utils.formatBytes32String(""), ethers.utils.formatBytes32String(""))
    expect(await (await IERC20__factory.connect(TOKE, user)).balanceOf(compounding.address)).equal(ethers.utils.parseEther('1'))
  });

  it('componding', async function () {
    expect(await (await IERC20__factory.connect(UNISWAP_TOKE_ETH_PAIR, user)).balanceOf(compounding.address)).equal('0')
    await compounding.compound({amount: parseEther('1000'), cycle: 0, wallet: compounding.address, chainId: 1}, 100, ethers.utils.formatBytes32String(""), ethers.utils.formatBytes32String(""))
    expect(await (await IERC20__factory.connect(TOKE_ETH_LP_TOKEN_STAKE_POOL, user)).balanceOf(compounding.address)).gt(ethers.utils.parseEther('100'))
    expect(await (await IERC20__factory.connect(TOKE, user)).balanceOf(compounding.address)).equal('0')
  })

  it('withdraw', async function () {
    expect(await (await IERC20__factory.connect(UNISWAP_TOKE_ETH_PAIR, user)).balanceOf(user.address)).equal('0')
    await compounding.requestWithdrawal();

    const manager = await IManager__factory.connect(WITHDRAWAL_CYCLE_MANAGER, await ethers.getSigner(WITHDRAWAL_CYCLE_MANAGER_ADMIN))
    await network.provider.send("evm_increaseTime", [3600000])
    await manager.completeRollover("");
  
    await compounding.withdraw()
    expect(await (await IERC20__factory.connect(UNISWAP_TOKE_ETH_PAIR, user)).balanceOf(user.address)).gt('0')
  })
});
