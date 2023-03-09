import {
  AppShell,
  Center,
  Group,
  Header,
  Loader,
  Space,
  Stack,
  Text,
} from "@mantine/core";
import type { NextPage } from "next";
import ConnectWallet from "../components/ConnectWallet";
import { RegisterButton } from "../components/RegisterButton";
import { ListFiles } from "../components/ListFiles";
import { UploadFile } from "../components/UploadFile";
import { FileInfo, getFiles, getPublicKey } from "../utils";
import { useEffect, useState } from "react";
import { MetaMaskInpageProvider } from "@metamask/providers";
import { config } from "../config";
import { ethers } from "ethers";
import { useListState } from "@mantine/hooks";
import styles from "../styles/home.module.css"


import '@rainbow-me/rainbowkit/styles.css';




const Home: NextPage = () => {
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [connectedPublicKey, setConnectedPublicKey] = useState<Buffer | null>(
    null
  );
  const [isNetworkValid, setIsNetworkValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileInfos, fileInfosHandlers] = useListState<FileInfo>([]);

  // On every page load, check if wallet is connected or not
  useEffect(() => {
    const verifyConnection = async () => {
      if (!window.ethereum) {
        console.log("Metamask is not installed.");
        return;
      }

      const provider = new ethers.providers.Web3Provider(
        window.ethereum as ethers.providers.ExternalProvider,
        "any"
      );
      const signer = provider.getSigner();
      // Get wallet
      try {
        const user = await signer.getAddress();
        setConnectedWallet(user);
      } catch (error) {
        setConnectedWallet(null);
      }
      // Get chain
      const chainId = await signer.getChainId();
      setIsNetworkValid(chainId === config.chainId);
    };

    verifyConnection();
  }, []);

  // Get public key on wallet and network change
  useEffect(() => {
    const fetchPublicKey = async () => {
      setLoading(true);
      setConnectedPublicKey(null);

      if (!(window.ethereum && connectedWallet && isNetworkValid)) {
        setLoading(false);
        return;
      }

      try {
        const publicKey = await getPublicKey(connectedWallet);
        setConnectedPublicKey(publicKey);
      } catch (error) {
        console.log(error);
        setConnectedPublicKey(null);
      }
      setLoading(false);
    };

    fetchPublicKey();
  }, [connectedWallet, isNetworkValid]);

  // Fetch file NFTs and store them in state
  useEffect(() => {
    const fetchFiles = async () => {
      fileInfosHandlers.setState([]);
      if (!connectedWallet) {
        return;
      }

      try {
        const fileInfos = await getFiles(connectedWallet);
        fileInfosHandlers.setState(fileInfos);
      } catch (error) {
        console.log(error);
      }
    };

    fetchFiles();
  }, [connectedWallet]);

  // Event listener for account and chain change on Metamask
  useEffect(() => {
    if (!window.ethereum) {
      return;
    }
    const ethereum = window.ethereum as MetaMaskInpageProvider;

    const handleAccountsChanged = (accounts: string[]) => {
      setConnectedWallet(accounts.length ? accounts[0] : null);
    };
    const handleChainChanged = () => {
      window.location.reload();
    };
    ethereum.on("accountsChanged", handleAccountsChanged as any);
    ethereum.on("chainChanged", handleChainChanged);

    return () => {
      // Clean up and remove event listeners
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
    };
  });

  return (
    
    <AppShell
      padding="md"
      header={
        <Header height={60} p="xs" className={styles.navbg}>
          <Group position="apart">
            <Text size="lg" weight="bold">
              ShareIt
            </Text>
            <ConnectWallet
              connectedWallet={connectedWallet}
              setConnectedWallet={setConnectedWallet}
              isNetworkValid={isNetworkValid}
              setIsNetworkValid={setIsNetworkValid}
            />
            {/* <ConnectWallet/> */}

          </Group>
        </Header>
      }
      styles={(theme) => ({
        main: {
          backgroundColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[8]
              : theme.colors.gray[0],
        },
      })}
    >
      <div className={styles.background}>
      {loading ? (
        <Center>
          <Stack>
            <Space h="lg" />
            <Loader />
          </Stack>
        </Center>
      ) : connectedWallet && isNetworkValid ? (
        connectedPublicKey ? (
          <Stack className="">
            <Group position="center" grow>
              <UploadFile
                connectedPublicKey={connectedPublicKey}
                connectedWallet={connectedWallet}
                fileInfosPrepend={fileInfosHandlers.prepend}
              />
            </Group>
            <ListFiles
              connectedWallet={connectedWallet}
              fileInfos={fileInfos}
            />
          </Stack>
        ) : (
          <Group position="center">
            <RegisterButton
              connectedWallet={connectedWallet}
              setConnectedPublicKey={setConnectedPublicKey}
            />
          </Group>
        )
      ) : (
        <Group position="center">
          <Text>
            {"Please connect to the " +
              config.chainName +
              " network using Metamask"}
          </Text>
        </Group>
      )}
      </div>
    </AppShell>
  );
};

export default Home;
