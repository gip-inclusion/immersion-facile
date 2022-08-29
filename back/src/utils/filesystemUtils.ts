import * as fse from "fs-extra";
import * as path from "path";
import { AppConfig } from "../adapters/primary/config/appConfig";

export const makeTemporaryStorageFolder = async (): Promise<string> => {
  const storageRoot: string = AppConfig.createFromEnv().storageRoot;
  const temporaryStorageRoot = path.join(storageRoot, "tmp/");
  const temporaryStorageRandomized = await fse.mkdtemp(temporaryStorageRoot);
  fse.ensureDirSync(temporaryStorageRandomized);
  return temporaryStorageRandomized;
};

export const makeTemporaryStorageFile = async (
  filepath: string,
): Promise<string> => path.join(await makeTemporaryStorageFolder(), filepath);

export const deleteFiles = (filesPaths: string[]): void => {
  filesPaths.map(deleteFile);
};

export const deleteFile = (filePath: string): void => {
  fse.unlinkSync(filePath);
};

export const deleteFileAndParentFolder = (filePath: string): void => {
  fse.unlinkSync(filePath);
  fse.removeSync(path.dirname(filePath));
};

export const retrieveParentDirectory = (pathName: string): string =>
  path.dirname(pathName);
