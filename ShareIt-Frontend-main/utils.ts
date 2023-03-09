import { MetadriveFile__factory } from "@metadrive/typechain-types";
import { ethers } from "ethers";
import { Dispatch } from "react";
import { config } from "./config";
import { ApolloClient, gql, InMemoryCache } from "@apollo/client";

export const hexStringToBuffer = (hexString: string) =>
  Buffer.from(hexString.slice(2), "hex");

export const getPublicKey = async (address: string): Promise<Buffer | null> => {
  const shareItContract = getShareItContract();
  const publicKey = await shareItContract.publicKeys(address);
  if (publicKey === ethers.constants.HashZero) {
    return null;
  } else {
    return hexStringToBuffer(publicKey);
  }
};

export interface CommonProps {
  connectedWallet: string | null;
  setConnectedWallet: Dispatch<string | null>;
  connectedPublicKey: Buffer;
  setConnectedPublicKey: Dispatch<Buffer | null>;
  isNetworkValid: boolean;
  setIsNetworkValid: Dispatch<boolean>;
}

export interface NftInfo {
  tokenId: number;
  metadata: NftMetadata;
}

export interface NftMetadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  filename: string;
}

export const getShareItContract = () => {
  const provider = new ethers.providers.Web3Provider(
    window.ethereum as ethers.providers.ExternalProvider,
    "any"
  );
  const signer = provider.getSigner();
  const shareItContract = MetadriveFile__factory.connect(
    config.shareItContractAddress,
    signer
  );
  return shareItContract;
};

export const getApolloClient = () => {
  return new ApolloClient({
    uri: config.metadriveFileSubgraphAddress,
    cache: new InMemoryCache(),
  });
};

export const trimAddress = (address: string, chars: number) => {
  return address.slice(0, chars + 2) + "..." + address.slice(-chars);
};

interface ParsedFileUrl {
  ipfsCid?: string;
}

export const parseFileUrl = (url: string): ParsedFileUrl | null => {
  if (url.startsWith("ipfs://")) {
    return {
      ipfsCid: url.slice(7),
    };
  } else {
    return null;
  }
};

interface GetFilesData {
  fileShares: {
    file: {
      tokenId: number;
      uri: string;
      owner: {
        address: string;
      };
    };
    user: {
      address: string;
    };
    fileKey: string;
  }[];
}

interface GetFilesVars {
  user: string;
}

export interface FileInfo {
  tokenId: number;
  url: string;
  filename: string;
  owner: string;
}

export const getFiles = async (user: string) => {
  const getFilesQuery = gql`
    query ($user: String!) {
      fileShares(where: { user: $user }) {
        file {
          tokenId
          uri
          owner {
            address
          }
        }
        user {
          address
        }
        fileKey
      }
    }
  `;
  const apolloClient = getApolloClient();
  const result = await apolloClient.query<GetFilesData, GetFilesVars>({
    query: getFilesQuery,
    variables: {
      user: user.toLowerCase(),
    },
  });

  const fileInfos: FileInfo[] = await Promise.all(
    result.data.fileShares.map(async (fileShare) => {
      const metadata = await fetch(fileShare.file.uri);
      const metadataJson = await metadata.json();
      const fileInfo: FileInfo = {
        tokenId: fileShare.file.tokenId,
        filename: metadataJson.filename,
        url: metadataJson.external_url,
        owner: ethers.utils.getAddress(fileShare.file.owner.address),
      };
      return fileInfo;
    })
  );

  return fileInfos.reverse();
};

interface GetFileSharesData {
  fileShares: {
    user: {
      address: string;
    };
  }[];
}

interface GetFileSharesVars {
  tokenId: String;
}

export const getFileShares = async (tokenId: number) => {
  const getFilesSharesQuery = gql`
    query ($tokenId: String!) {
      fileShares(where: { file: $tokenId }) {
        user {
          address
        }
      }
    }
  `;

  const apolloClient = getApolloClient();
  const result = await apolloClient.query<GetFileSharesData, GetFileSharesVars>(
    {
      query: getFilesSharesQuery,
      variables: {
        tokenId: tokenId.toString(),
      },
    }
  );

  const sharedWith: string[] = result.data.fileShares.map((fileShare) =>
    ethers.utils.getAddress(fileShare.user.address)
  );
  return sharedWith.reverse();
};
