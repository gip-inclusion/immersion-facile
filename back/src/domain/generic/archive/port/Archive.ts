import * as archiver from "archiver";
import * as fse from "fs-extra";
import path from "path";
import { deleteFiles } from "../../../../utils/filesystemUtils";

export type AddFilesOptions = {
  removeOriginal: boolean;
};

export class Archive {
  private readonly outputFile: fse.WriteStream;
  private readonly archive: archiver.Archiver;

  constructor(archiveFilename: string) {
    this.outputFile = fse.createWriteStream(archiveFilename);
    this.archive = archiver.create("zip", {
      zlib: { level: 9 }, // Sets the compression level.
    });
    this.archive.pipe(this.outputFile);
  }

  public async addFiles(
    filepaths: string[],
    options: AddFilesOptions,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      filepaths.map((filepath: string) =>
        this.archive.file(filepath, { name: path.basename(filepath) }),
      );

      this.outputFile.on("finish", () => {
        if (options.removeOriginal) deleteFiles(filepaths);
        resolve();
      });
      this.outputFile.on("error", reject);

      //eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.archive.finalize();
    });
  }
}
