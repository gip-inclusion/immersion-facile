import * as fse from "fs-extra";
import * as path from "path";

//https://stackoverflow.com/questions/10265798/determine-project-root-from-a-running-node-js-application
// This assume the back process is launched from /back

export const temporaryStoragePath = (filepath = ""): string => {
  const temporaryStoragePath = "./storage/tmp";
  fse.ensureDirSync(temporaryStoragePath);

  return path.join(temporaryStoragePath, filepath);
};

export const deleteFiles = (filesPaths: string[]): void => {
  filesPaths.map(deleteFile);
};

export const deleteFile = (filePath: string): void => {
  return fse.unlinkSync(filePath);
};
