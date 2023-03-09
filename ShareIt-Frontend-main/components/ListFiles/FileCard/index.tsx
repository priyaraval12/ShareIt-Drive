import { Badge, Button, Card, Stack, Text, Tooltip } from "@mantine/core";
import { MetaMaskInpageProvider } from "@metamask/providers";
import {
  CommonProps,
  getShareItContract,
  parseFileUrl,
  FileInfo,
  trimAddress,
} from "../../../utils";
import * as bip39 from "bip39";
import { decrypt } from "@metadrive/lib";
import { saveAs } from "file-saver";
import { SharingModal } from "./SharingModal";
import { useState } from "react";
import { DownloadSimple, Share } from "phosphor-react";
import styles from "../../../styles/home.module.css"
interface FileCardProps extends Pick<CommonProps, "connectedWallet"> {
  fileInfo: FileInfo;
}

export const FileCard = ({
  connectedWallet,
  fileInfo: { tokenId, url, filename, owner },
}: FileCardProps) => {
  const [isSharingModalOpened, setIsSharingModalOpened] = useState(false);
  const isOwned = owner.toLowerCase() === connectedWallet?.toLowerCase();

  const handleFileDownload = async () => {
    if (!(window.ethereum && url && connectedWallet)) {
      return;
    }

    const parsedFileUrl = parseFileUrl(url);
    const ipfsCid = parsedFileUrl?.ipfsCid;
    if (!ipfsCid) {
      return;
    }

    const shareItContract = getShareItContract();
    const fileKey = await shareItContract.fileKeys(
      tokenId,
      connectedWallet
    );

    const ethereum = window.ethereum as MetaMaskInpageProvider;
    const mnemonic = await ethereum.request({
      method: "eth_decrypt",
      params: [fileKey, connectedWallet],
    });

    const symmetricKey: Buffer = await bip39.mnemonicToSeed(mnemonic as string);

    const fetchResponse = await fetch("https://ipfs.io/ipfs/" + ipfsCid);
    const buffer = new Uint8Array(await fetchResponse.arrayBuffer());
    const fileBuffer = await decrypt(buffer, symmetricKey);
    saveAs(new Blob([fileBuffer]), filename);
  };

  return (
    <>
    <div >
      {isOwned ? (
        <SharingModal
          opened={isSharingModalOpened}
          setOpened={setIsSharingModalOpened}
          connectedWallet={connectedWallet}
          tokenId={tokenId}
        />
      ) : null}
      <Card className={styles.filecardbg}>
        {isOwned ? (
          <Badge>Owned</Badge>
        ) : (
          <Tooltip
            position="bottom"
            label={"Owned by " + trimAddress(owner, 3)}
          >
            <Badge>Shared</Badge>
          </Tooltip>
        )}
        <Stack>
          <Text align="center">{filename}</Text>
          <Button leftIcon={<DownloadSimple />} onClick={handleFileDownload}>
            Download
          </Button>

          {isOwned ? (
            <Button
              leftIcon={<Share />}
              onClick={() => setIsSharingModalOpened(true)}
            >
              Share
            </Button>
          ) : null}
        </Stack>
      </Card>
      </div>
    </>
  );
};
