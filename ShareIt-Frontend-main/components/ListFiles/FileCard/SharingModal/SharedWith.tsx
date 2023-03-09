import { ActionIcon, Group, Loader, Text, Tooltip } from "@mantine/core";
import { BigNumberish } from "ethers";
import { XCircle } from "phosphor-react";
import { useState } from "react";
import {
  CommonProps,
  getShareItContract,
  trimAddress,
} from "../../../../utils";

interface SharedWithProps extends Pick<CommonProps, "connectedWallet"> {
  tokenId: BigNumberish;
  address: string;
  remove: () => void;
}

export const SharedWith = ({
  connectedWallet,
  tokenId,
  address,
  remove,
}: SharedWithProps) => {
  const [loading, setLoading] = useState(false);

  const handleUnshare = async (address: string) => {
    if (!connectedWallet) {
      return;
    }
    setLoading(true);

    try {
      const shareItContract = getShareItContract();
      const tx = await shareItContract.unshare(tokenId, address);
      await tx.wait();
      remove();
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  return (
    <Group key={address} position="apart">
      <Text>{trimAddress(address, 10)}</Text>
      {loading ? (
        <Loader size={20} />
      ) : (
        <Tooltip label="Stop sharing">
          <ActionIcon
            variant="transparent"
            onClick={() => handleUnshare(address)}
          >
            <XCircle size={20} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
};
