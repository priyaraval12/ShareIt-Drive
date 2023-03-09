interface Config {
  chainId: number;
  web3StorageToken: string;
  chainName: string;
  shareItContractAddress: string;
  metadriveFileSubgraphAddress: string;
  metamaskChainInfo: {
    chainId: string;
    rpcUrls: string[];
    chainName: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    blockExplorerUrls: string[];
  };
}

interface AllConfigs {
  development: Config;
  production?: Config;
  test?: Config;
}

const allConfigs: AllConfigs = {
  development: {
    chainId: 80001,
    chainName: "Polygon Mumbai",
    web3StorageToken: process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN,
    shareItContractAddress: "0x5579b23fe6753Ecb6b64C4814638339Ac5F49785",
    metadriveFileSubgraphAddress:
      "https://api.thegraph.com/subgraphs/name/0xmetadrive/metadrive-alpha-mumbai",
    metamaskChainInfo: {
      chainId: "0x13881",
      rpcUrls: ["https://rpc-mumbai.matic.today"],
      chainName: "Polygon Mumbai",
      nativeCurrency: {
        name: "MATIC",
        symbol: "MATIC",
        decimals: 18,
      },
      blockExplorerUrls: ["https://mumbai.polygonscan.com"],
    },
  },
  production: {
    chainId: 80001,
    chainName: "Polygon Mumbai",
    web3StorageToken: process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN,
    shareItContractAddress: "0x5579b23fe6753Ecb6b64C4814638339Ac5F49785",
    metadriveFileSubgraphAddress:
      "https://api.thegraph.com/subgraphs/name/0xmetadrive/metadrive-alpha-mumbai",
    metamaskChainInfo: {
      chainId: "0x13881",
      rpcUrls: ["https://rpc-mumbai.matic.today"],
      chainName: "Polygon Mumbai",
      nativeCurrency: {
        name: "MATIC",
        symbol: "MATIC",
        decimals: 18,
      },
      blockExplorerUrls: ["https://mumbai.polygonscan.com"],
    },
  },
};

type NodeEnvs = "development";

export const config = allConfigs[process.env.NODE_ENV as NodeEnvs];
