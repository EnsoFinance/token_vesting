/**
 * @type import('hardhat/config').HardhatUserConfig
 */
import { HardhatUserConfig, NetworksUserConfig, NetworkUserConfig } from "hardhat/types";
import { resolve } from "path";
import { config as dotenvConfig } from "dotenv";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
// import "hardhat-gas-reporter"
import "@typechain/hardhat";
import "hardhat-etherscan-abi";
import "solidity-coverage";

dotenvConfig({ path: resolve(__dirname, "./.env") });

const chainIds = {
  ganache: 1337,
  goerli: 5,
  hardhat: 31337,
  kovan: 42,
  mainnet: 1,
  rinkeby: 4,
  ropsten: 3,
};

// Ensure that we have all the environment variables we need.
let mnemonic: string | undefined = process.env.MNEMONIC;
let infuraApiKey: string | undefined = process.env.INFURA_API_KEY;
let etherscanApiKey: string | undefined = process.env.ETHERSCAN_API_KEY;
let archiveNode: string | undefined = process.env.ARCHIVE_NODE;

let networkIndex: number = process.argv.findIndex(arg => arg === "--network");
if (networkIndex > 0) {
  if (process.argv[networkIndex + 1] !== "hardhat") {
    if (!mnemonic) {
      throw new Error("Please set your MNEMONIC in a .env file");
    }
    if (!infuraApiKey) {
      throw new Error("Please set your INFURA_API_KEY in a .env file");
    }
  } else {
    if (process.argv[2] == "test" && !archiveNode) {
      throw new Error("Please set your ARCHIVE_NODE in a .env file");
    }
  }
} else {
  if (process.argv[2] == "test" && !archiveNode) {
    throw new Error("Please set your ARCHIVE_NODE in a .env file");
  }
}

function getNetworks(): NetworksUserConfig {
  let networks: NetworksUserConfig = {
    hardhat: {
      chainId: chainIds.mainnet,
    },
  };
  if (networks.hardhat) {
    if (mnemonic)
      networks.hardhat.accounts = {
        mnemonic,
      };
    if (archiveNode)
      networks.hardhat.forking = {
        url: archiveNode,
        blockNumber: 12675000,
      };
  }
  if (mnemonic && infuraApiKey) {
    networks.goerli = createTestnetConfig("goerli");
    networks.kovan = createTestnetConfig("kovan");
    networks.rinkeby = createTestnetConfig("rinkeby");
    networks.ropsten = createTestnetConfig("ropsten");
  }
  return networks;
}

function createTestnetConfig(network: keyof typeof chainIds): NetworkUserConfig {
  const url: string = "https://" + network + ".infura.io/v3/" + infuraApiKey;
  return {
    accounts: {
      count: 10,
      initialIndex: 0,
      mnemonic,
      path: "m/44'/60'/0'/0",
    },
    chainId: chainIds[network],
    url,
  };
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: getNetworks(),
  etherscan: {
    apiKey: etherscanApiKey,
  },
  // gasReporter: {
  //   currency: 'USD',
  //   gasPrice: 45
  // },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    compilers: [
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 20,
          },
        },
      },
      {
        version: "0.6.10",
        settings: {
          optimizer: {
            enabled: true,
            runs: 20,
          },
        },
      },
      {
        version: "0.8.9",
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000,
          },
        },
      },
      {
        version: "0.6.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 20,
          },
        },
      },
    ],
  },
  mocha: {
    timeout: 40000,
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
};

export default config;
