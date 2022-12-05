import * as fse from "fs-extra";
import path from "path";
import {
  deleteFileAndParentFolder,
  makeTemporaryStorageFile,
  retrieveParentDirectory,
} from "./filesystemUtils";

describe("Filesystem utils", () => {
  it("should return the temporary storage directory located in $STORAGE_ROOT/tmp", async () => {
    const tempPath = await makeTemporaryStorageFile("./");
    const temporaryStoragePathRegex = /storage\/tmp\/[A-Za-z0-9]{6}/;
    expect(tempPath).toMatch(temporaryStoragePathRegex);
    expect(fse.pathExistsSync(tempPath)).toBe(true);

    fse.removeSync(tempPath);
  });

  it("should return the filepath located temporary storage directory", async () => {
    const filename = "myfile";
    const pathResult = await makeTemporaryStorageFile(filename);
    fse.writeFileSync(pathResult, "Hey there!");

    expect(fse.pathExistsSync(pathResult)).toBe(true);
    fse.unlinkSync(pathResult);
    //fse.removeSync(pathResult);
  });

  it("should remove the filepath and randomized temporary storage directory", async () => {
    const filename = "myfile";
    const pathResult = await makeTemporaryStorageFile(filename);
    const parentDirectory = path.dirname(pathResult);

    fse.writeFileSync(pathResult, "Hey there!");
    expect(fse.pathExistsSync(pathResult)).toBe(true);

    deleteFileAndParentFolder(pathResult);

    expect(fse.pathExistsSync(pathResult)).toBe(false);
    expect(fse.pathExistsSync(parentDirectory)).toBe(false);
  });

  it("retrieve parent directory path", () => {
    const directory = "/home/OAuth/immersion-facile/back/storage/tmp";
    const expectedParentDirectoryPath =
      "/home/OAuth/immersion-facile/back/storage";
    expect(retrieveParentDirectory(directory)).toBe(
      expectedParentDirectoryPath,
    );
  });
});
