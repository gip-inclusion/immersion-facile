import { z } from "zod";
import { UuidGenerator } from "../../../core/ports/UuidGenerator";
import { UseCase } from "../../../core/UseCase";
import type { StoredFile } from "../entity/StoredFile";
import { DocumentGateway } from "../port/DocumentGateway";

type MulterFile = {
  originalname: string;
  encoding: string;
  size: number;
  buffer: Buffer;
};

export type UploadFileInput = {
  multerFile: MulterFile;
  renameFileToId?: boolean;
};

export class UploadLogo extends UseCase<UploadFileInput, string> {
  protected inputSchema = z.any();

  readonly #documentGateway: DocumentGateway;

  readonly #uuidGenerator: UuidGenerator;

  constructor(documentGateway: DocumentGateway, uuidGenerator: UuidGenerator) {
    super();
    this.#documentGateway = documentGateway;
    this.#uuidGenerator = uuidGenerator;
  }

  protected async _execute({
    multerFile,
    renameFileToId = true,
  }: UploadFileInput): Promise<string> {
    const fileId = renameFileToId
      ? this.#replaceNameWithUuid(multerFile)
      : multerFile.originalname;

    const file: StoredFile = {
      id: fileId,
      name: multerFile.originalname,
      encoding: multerFile.encoding,
      size: multerFile.size,
      buffer: multerFile.buffer,
    };

    await this.#documentGateway.put(file);
    return this.#documentGateway.getFileUrl(file);
  }

  #replaceNameWithUuid(multerFile: MulterFile) {
    const extension = multerFile.originalname.split(".").at(-1);
    return `${this.#uuidGenerator.new()}.${extension}`;
  }
}
