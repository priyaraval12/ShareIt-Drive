import { Group, NativeSelect, SimpleGrid, Stack } from "@mantine/core";
import { useEffect, useState } from "react";
import { CommonProps, FileInfo } from "../../utils";
import { FileCard } from "./FileCard";
import styles from "../../styles/home.module.css"
interface ListFilesProps extends Pick<CommonProps, "connectedWallet"> {
  fileInfos: FileInfo[];
}

export const ListFiles = ({ connectedWallet, fileInfos }: ListFilesProps) => {
  const selectValues = ["All files", "Owned by you", "Shared with you"];
  const [selectValue, setSelectValue] =
    useState<typeof selectValues[number]>("All files");
  const [filesToShow, setFilesToShow] = useState<FileInfo[]>([]);

  useEffect(() => {
    if (selectValue === "All files") {
      setFilesToShow(fileInfos);
    } else if (selectValue === "Owned by you") {
      setFilesToShow(
        fileInfos.filter(
          (x) => x.owner.toLowerCase() === connectedWallet?.toLowerCase()
        )
      );
    } else if (selectValue === "Shared with you") {
      setFilesToShow(
        fileInfos.filter(
          (x) => x.owner.toLowerCase() !== connectedWallet?.toLowerCase()
        )
      );
    }
  }, [fileInfos, selectValue, connectedWallet]);

  return (
    <Stack>
      <Group position="right" className={styles.right}>
        <NativeSelect
          data={selectValues}
          label="Filter files"
          value={selectValue}
          onChange={(event) =>
            setSelectValue(
              event.currentTarget.value as typeof selectValues[number]
            )
          }
        />
      </Group>
      <SimpleGrid cols={6} className={styles.alignment}>
        {filesToShow.map((fileInfo: FileInfo) => (
          <FileCard
            key={fileInfo.tokenId}
            fileInfo={fileInfo}
            connectedWallet={connectedWallet}
          />
        ))}
      </SimpleGrid>
    </Stack>
  );
};
