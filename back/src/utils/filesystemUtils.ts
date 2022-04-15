import * as fse from "fs-extra";
import * as path from "path";
import { AppConfig } from "../adapters/primary/appConfig";

export const temporaryStoragePath = async (filepath = ""): Promise<string> => {
  const storageRoot: string = AppConfig.createFromEnv()?.storageRoot;
  const temporaryStorageRoot = path.join(storageRoot, "tmp/");
  const temporaryStorageRandomized = await fse.mkdtemp(temporaryStorageRoot);
  fse.ensureDirSync(temporaryStorageRandomized);
  return path.join(temporaryStorageRandomized, filepath);
};

export const deleteFiles = (filesPaths: string[]): void => {
  filesPaths.map(deleteFile);
};

export const deleteFile = (filePath: string): void => fse.unlinkSync(filePath);

export const deleteFileAndParentFolder = (filePath: string): void => {
  fse.unlinkSync(filePath);
  fse.removeSync(path.dirname(filePath));
};
