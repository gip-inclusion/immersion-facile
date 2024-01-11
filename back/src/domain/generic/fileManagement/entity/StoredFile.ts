import { Flavor } from "shared";
import { DocumentGateway } from "../port/DocumentGateway";

type StoredFileId = Flavor<string, "StoredFileId">;

export interface StoredFile {
  id: StoredFileId;
  name: string;
  encoding: string;
  size: number;
  buffer: Buffer;
}

type MulterFile = {
  originalname: string;
  encoding: string;
  size: number;
  buffer: Buffer;
};

export const uploadFileToGateway = async (
  {
    multerFile,
    fileId,
  }: {
    multerFile: MulterFile;
    fileId: StoredFileId;
  },
  documentGateway: DocumentGateway,
) => {
  const file: StoredFile = {
    id: fileId,
    name: multerFile.originalname,
    encoding: multerFile.encoding,
    size: multerFile.size,
    buffer: multerFile.buffer,
  };

  await documentGateway.put(file);
  return documentGateway.getFileUrl(file);
};
