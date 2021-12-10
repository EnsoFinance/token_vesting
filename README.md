# Token Vesting
Contract for team, investors and advisors for token lockup periods.


## Practical

### Deployment
`_start` common starting time of vesting across all parties
`_enso` Enso ERC20 token that will be released over X time 
`_treasury` treasury address for that approves tokens into vesting contract

## Register
Only `owner` which is is set at deployment can register participant.

`_vester` address to vest.
`_unlock` epoch time when full unlock.
`_allocated` amount of tokens allocated.

## Unregister
Only `owner`

`_vester` address to remove from vesting.
Transfers approval back to treasury if vester has violated any prior agreements.

## Claim
Only registered `vester`.

Calculate based upon epoch time from `start` to `unlock` that they are applicable for claiming, and transfer tokens from approval from treasury.

## UpdateTreasury
Emergency from `owner` for updating treasury address.

🟥 Assumption is all approvals to this contract will have been revoked prior to this emergency function. 🟥


## Usage

### Pre Requisites

Before running any command, make sure to install dependencies:

```sh
$ yarn install
```

### Compile

Compile the smart contracts with Hardhat:

```sh
$ yarn compile
```

### TypeChain

Compile the smart contracts and generate TypeChain artifacts:

```sh
$ yarn typechain
```

### Lint Solidity

Lint the Solidity code:

```sh
$ yarn lint:sol
```

### Lint TypeScript

Lint the TypeScript code:

```sh
$ yarn lint:ts
```

### Test

Run the Mocha tests:

```sh
$ yarn test
```

### Coverage

Generate the code coverage report:

```sh
$ yarn coverage
```

### Clean

Delete the smart contract artifacts, the coverage reports and the Hardhat cache:

```sh
$ yarn clean
```


