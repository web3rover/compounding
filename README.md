# Tokemak Compounding

To run tests first you need to set the below ENV variable. The Alchemy key should be for Ethereum mainnet

```
export ALCHEMY_API_KEY=
```

Now run the below commands to run tests:

```
yarn install
npx hardhat compile
npx hardhat test
```

# Process

The smart contract auto-compounds the rewards from Tokemak's UNI LP token pool to maximize yield. 

- **Deposits**
    - The contract accepts deposits from a single, pre-determined user (you).
    - The contract accepts deposits of `TOKE-ETH` Uniswap V2 LP tokens.
    - The contract always stakes all its deposits in Tokemak's UNI LP token pool.
- **Auto-compounding**
    - The contract auto-compounds Tokemak's staking rewards (with a function call).
    - "Auto-compound" means claiming any outstanding rewards from Tokemak, converting them into more `TOKE-ETH` Uniswap V2 LP tokens, and staking them as well.
- **Withdrawals**
    - The contract accepts withdrawals to a single, pre-determined user (you).
    - The contract processes withdrawals in TOKE-ETH Uniswap V2 LP tokens.