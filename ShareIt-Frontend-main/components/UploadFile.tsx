import { Button, Stack, StylesApiProvider, Text } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { encrypt } from "@metadrive/lib";
import { useState } from "react";
import { Web3Storage } from "web3.storage";
import { config } from "../config";
import * as sigUtil from "@metamask/eth-sig-util";
import {
  CommonProps,
  FileInfo,
  getShareItContract,
  NftMetadata,
} from "../utils";
import { UploadSimple } from "phosphor-react";
import styles from "../styles/home.module.css"
const web3StorageClient = new Web3Storage({
  // @ts-ignore: Object is possibly 'null'.
  token: process.env.NEXT_PUBLIC_WEB3STORAGE_TOKEN,
  endpoint: new URL("https://api.web3.storage"),
});

interface UploadFileProps
  extends Pick<CommonProps, "connectedPublicKey" | "connectedWallet"> {
  fileInfosPrepend: (...items: FileInfo[]) => void;
}

export const UploadFile = ({
  connectedPublicKey,
  connectedWallet,
  fileInfosPrepend,
}: UploadFileProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);

  const handleDropzoneDrop = (files: File[]) => {
    setFile(files[0]);
  };

  const handleFileUpload = async () => {
    // Check if there's a file and valid wallet config
    if (!(file && connectedPublicKey && connectedWallet)) {
      return;
    }
    setLoading(true);

    try {
      const shareItContract = getShareItContract();

      // Encrypt file
      setLoadingStatus("Encrypting file");
      const fileBuffer = await file.arrayBuffer();
      const { buffer: encryptedFileBuffer, mnemonic } = await encrypt(
        new Uint8Array(fileBuffer)
      );

      // Upload encrypted file to IPFS
      setLoadingStatus("Uploading encrypted file to IPFS");
      const cid = await web3StorageClient.put(
        [new File([encryptedFileBuffer], file.name)],
        {
          wrapWithDirectory: false,
        }
      );

      // Encrypt symmetric key with user's public key
      const encryptedSymmetricKey = Buffer.from(
        JSON.stringify(
          sigUtil.encrypt({
            publicKey: connectedPublicKey.toString("base64"),
            data: mnemonic,
            version: "x25519-xsalsa20-poly1305",
          })
        )
      ).toString("hex");

      // Mint ShareIt NFT for the uploaded file
      setLoadingStatus("Minting ShareIt NFT");
      const nftMetadata: NftMetadata = {
        name: "ShareIt file: " + file.name,
        description: "Encrypted file uploaded on ShareIt",
        image: "http://files.skghosh.me/files.jpg",
        external_url: "ipfs://" + cid,
        filename: file.name,
      };
      const dataUrl =
        "data:application/json;base64," +
        Buffer.from(JSON.stringify(nftMetadata)).toString("base64");
      const tx = await shareItContract.safeMint(
        connectedWallet,
        dataUrl,
        encryptedSymmetricKey
      );
      const receipt = await tx.wait();
      const mintEvent = receipt.events?.filter((x) => {
        return x.event === "Mint";
      })[0];
      const tokenId: number = Number(mintEvent?.args?.tokenId);

      setLoadingStatus(null);
      setLoading(false);
      setFile(null);
      fileInfosPrepend({
        tokenId,
        owner: connectedWallet,
        filename: file.name,
        url: "ipfs://" + cid,
      });
    } catch (error) {
      console.log(error);
    }

    setLoadingStatus(null);
    setLoading(false);
  };

  return (
    <Stack className={styles.top}>
      <Dropzone onDrop={handleDropzoneDrop} multiple={false}>
        <Stack >
          {file ? <Text weight="semibold">Selected: {file.name}</Text> : null}
          <Text weight="semibold" align="center" >
            Drag file here or click to select file
          </Text>
        </Stack>
      </Dropzone>
      <Button
        leftIcon={<UploadSimple />}
        loading={loading}
        onClick={handleFileUpload}
      >
        {loading && loadingStatus ? loadingStatus : "Upload"}
      </Button>
    </Stack>
  );
};
