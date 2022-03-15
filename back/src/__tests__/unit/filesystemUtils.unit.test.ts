import * as fse from "fs-extra";
import { temporaryStoragePath } from "../../utils/filesystemUtils";

describe("Filesystem utils", () => {
  it("should return the temporary storage directory located in $APP_ROOT/storage/tmp", () => {
    expect(temporaryStoragePath()).toBe("storage/tmp");
    expect(fse.pathExistsSync("storage/tmp/")).toBe(true);

    fse.removeSync(temporaryStoragePath());
  });

  it("should return the filepath located temporary storage directory", () => {
    const filename = "myfile";
    const pathResult = temporaryStoragePath(filename);
    fse.writeFileSync(pathResult, "Hey there!");

    expect(pathResult).toBe("storage/tmp/myfile");
    expect(fse.pathExistsSync(pathResult)).toBe(true);

    fse.unlinkSync(pathResult);
    fse.removeSync(temporaryStoragePath());
  });
});
