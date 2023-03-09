import { Button, Modal, Space, Stack, Text, TextInput } from "@mantine/core";
import { MetaMaskInpageProvider } from "@metamask/providers";
import { BigNumberish, ethers } from "ethers";
import { Dispatch, useEffect, useState } from "react";
import {
  CommonProps,
  getFileShares,
  getShareItContract,
  getPublicKey,
} from "../../../../utils";
import * as sigUtil from "@metamask/eth-sig-util";
import { useDebouncedValue, useListState } from "@mantine/hooks";
import { CheckCircle, Share } from "phosphor-react";
import { SharedWith } from "./SharedWith";

interface SharingModalProps extends Pick<CommonProps, "connectedWallet"> {
  opened: boolean;
  setOpened: Dispatch<boolean>;
  tokenId: BigNumberish;
}

export const SharingModal = ({
  connectedWallet,
  opened,
  setOpened,
  tokenId,
}: SharingModalProps) => {
  const [address, setAddress] = useState<string>("");
  const [debouncedAddress] = useDebouncedValue(address, 200);
  const [isAddressValid, setIsAddressValid] = useState(false);
  const [publicKey, setPublicKey] = useState<Buffer | null>(null);
  const [loading, setLoading] = useState(false);
  const [sharedWith, sharedWithHandlers] = useListState<string>([]);

  const handleShare = async () => {
    if (!(connectedWallet && isAddressValid && publicKey)) {
      return;
    }

    setLoading(true);
    try {
      const shareItContract = getShareItContract();
      const ownerFileKey = await shareItContract.fileKeys(
        tokenId,
        connectedWallet
      );

      const ethereum = window.ethereum as MetaMaskInpageProvider;
      const mnemonic = await ethereum.request({
        method: "eth_decrypt",
        params: [ownerFileKey, connectedWallet],
      });

      // Encrypt symmetric key with user's public key
      const userFileKey = Buffer.from(
        JSON.stringify(
          sigUtil.encrypt({
            publicKey: publicKey.toString("base64"),
            data: mnemonic,
            version: "x25519-xsalsa20-poly1305",
          })
        )
      ).toString("hex");

      const tx = await shareItContract.share(
        tokenId,
        address,
        userFileKey
      );
      await tx.wait();

      sharedWithHandlers.prepend(address);
      setAddress("");
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  // Fetch the list of users the file is shared with
  useEffect(() => {
    const fetchFileShares = async () => {
      const fileShares = await getFileShares(Number(tokenId));
      sharedWithHandlers.setState(
        fileShares.filter((x) => x !== connectedWallet)
      );
    };
  }, [connectedWallet, tokenId]);

  // Check if the entered address is valid
  useEffect(() => {
    try {
      setAddress(ethers.utils.getAddress(address));
      setIsAddressValid(true);
    } catch (error) {
      setIsAddressValid(false);
    }
  }, [address]);

  // Fetch public key of the entered address
  useEffect(() => {
    const fetchPublicKey = async () => {
      setPublicKey(null);
      if (!(isAddressValid && connectedWallet && debouncedAddress)) {
        return;
      }
      try {
        const publicKey = await getPublicKey(debouncedAddress);
        setPublicKey(publicKey);
      } catch (error) {
        console.log(error);
        setPublicKey(null);
      }
    };

    fetchPublicKey();
  }, [debouncedAddress, connectedWallet, isAddressValid]);

  return (
    <Modal
      centered
      opened={opened}
      onClose={() => setOpened(false)}
      overflow="inside"
      title="Share file"
    >
      <Stack>
        <TextInput
          value={address}
          onChange={(event) => setAddress(event.currentTarget.value)}
          label="Address"
          description="Of the user you want to share the file with"
          error={
            isAddressValid
              ? publicKey
                ? false
                : "Address is not registered with ShareIt"
              : "Invalid address"
          }
          rightSection={publicKey ? <CheckCircle color="green" /> : null}
        />
        <Button
          leftIcon={<Share />}
          onClick={handleShare}
          loading={loading}
          disabled={!publicKey}
        >
          Share
        </Button>
        {sharedWith.length ? (
          <>
            <Space />
            <Text>Shared with</Text>
            <Stack>
              {sharedWith.map((address) => (
                <SharedWith
                  key={address}
                  tokenId={tokenId}
                  connectedWallet={connectedWallet}
                  address={address}
                  remove={() =>
                    sharedWithHandlers.remove(sharedWith.indexOf(address))
                  }
                />
              ))}
            </Stack>
          </>
        ) : null}
      </Stack>
    </Modal>
  );
};
