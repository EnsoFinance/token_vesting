const hre = require('hardhat')
const { BigNumber, ethers } = require('ethers')

const enso_token = '0xB8c77482e45F1F44dE1745F52C74426C631bDD52' // TODO: UPDATE AFTER DEPLOYMENT ENSO token
const enso_multisig = '0xEE0e85c384F7370FF3eb551E92A71A4AFc1B259F' //ENSO Treasury

const addresses = 

const starts = 

const unlocks = 

const amounts = 
  
async function main() {
  const Vesting = await hre.ethers.getContractFactory("Vesting")
  const vesting = await Vesting.deploy(enso_token, enso_multisig)

  await vesting.batchRegister(addresses, starts, unlocks, amounts)
}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
