import * as fse from "fs-extra";
import * as archiver from "archiver";
import path from "path";

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

  public async addFiles(filepaths: string[]): Promise<void> {
    return new Promise(async (resolve, reject) => {
      filepaths.map((filepath: string) =>
        this.archive.file(filepath, { name: path.basename(filepath) }),
      );

      this.outputFile.on("finish", () => {
        resolve();
      });
      this.outputFile.on("error", reject);

      await this.archive.finalize();
    });
  }
}
