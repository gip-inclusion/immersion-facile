import { z } from "zod";
import { UseCase } from "../../../core/UseCase";
import { UuidGenerator } from "../../../core/uuid-generator/ports/UuidGenerator";
import type { StoredFile } from "../entity/StoredFile";
import { DocumentGateway } from "../port/DocumentGateway";

export type UploadFileInput = {
  multerFile: Express.Multer.File;
  renameFileToId?: boolean;
};

export class UploadFile extends UseCase<UploadFileInput, string> {
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
      mimetype: multerFile.mimetype,
    };

    await this.#documentGateway.put(file);
    return this.#documentGateway.getFileUrl(file);
  }

  #replaceNameWithUuid(multerFile: Express.Multer.File) {
    const extension = multerFile.originalname.split(".").at(-1);
    return `${this.#uuidGenerator.new()}.${extension}`;
  }
}
