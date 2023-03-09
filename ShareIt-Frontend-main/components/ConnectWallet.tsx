import { Button } from "@mantine/core";
import { ethers } from "ethers";
import { UserCircle, WarningCircle } from "phosphor-react";
import { config } from "../config";
import { CommonProps, trimAddress } from "../utils";

type ConnectWalletProps = Omit<
  CommonProps,
  "connectedPublicKey" | "setConnectedPublicKey"
>;

const ConnectWallet = ({
  connectedWallet,
  setConnectedWallet,
  isNetworkValid,
  setIsNetworkValid,
}: ConnectWalletProps) => {
  // Connect Metamask wallet
  const connectWallet = async () => {
    console.log("CLicked...");
    
    if (!window.ethereum) {
      return;
    }
    const provider = new ethers.providers.Web3Provider(
      window.ethereum as ethers.providers.ExternalProvider,
      "any"
    );
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    // Get wallet
    try {
      const wallet = await signer.getAddress();
      setConnectedWallet(wallet);
    } catch (error) {
      setConnectedWallet(null);
    }
    // Get chain
    const chainId = await signer.getChainId();
    setIsNetworkValid(chainId === config.chainId);
  };

  // Change chain on Metamask to the one we want
  const changeChain = async () => {
    console.log("Chain change called..");
    
    if (!window.ethereum) {
      console.log("Metamask is not installed.");
      return;
    }
    const provider = new ethers.providers.Web3Provider(
      window.ethereum as ethers.providers.ExternalProvider,
      "any"
    );
    await provider.send("wallet_addEthereumChain", [config.metamaskChainInfo]);
  };

  return connectedWallet ? (
    isNetworkValid ? (
      <Button
        leftIcon={<UserCircle size={20} />}
        variant="gradient"
        gradient={{ from: "teal", to: "lime", deg: 105 }}
      >
        Connected to {trimAddress(connectedWallet, 4)}
      </Button>
    ) : (
      <Button
        leftIcon={<WarningCircle size={20} />}
        variant="gradient"
        gradient={{ from: "orange", to: "red" }}
        onClick={changeChain}
      >
        {"Switch network to " + config.chainName}
      </Button>
    )
  ) : (
    <Button
      leftIcon={<WarningCircle size={20} />}
      variant="gradient"
      gradient={{ from: "orange", to: "red" }}
      onClick={async () => {
        await connectWallet();
        await changeChain();
      }}
    >
      Connect Wallet
    </Button>
  );
};

export default ConnectWallet;
