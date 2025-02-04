import { AbsoluteUrl, errors, zStringMinLength1 } from "shared";
import { z } from "zod";
import { UseCase } from "../../UseCase";
import { UuidGenerator } from "../../uuid-generator/ports/UuidGenerator";
import type { StoredFile } from "../entity/StoredFile";
import { DocumentGateway } from "../port/DocumentGateway";

export type FileInput = Omit<StoredFile, "id">;

export type UploadFileInput = {
  file: FileInput;
  renameFileToId?: boolean;
};

// biome-ignore lint/correctness/noUnusedVariables: <explanation>
const uploadFileInput: z.Schema<UploadFileInput> = z.object({
  file: z.object({
    name: zStringMinLength1,
    encoding: zStringMinLength1,
    size: z.number(),
    buffer: z.instanceof(Buffer), // class not supported by NarrowEvent<Topic>["payload"]
    mimetype: zStringMinLength1,
  }),
  renameFileToId: z.boolean().optional(),
});

export class UploadFile extends UseCase<UploadFileInput, AbsoluteUrl> {
  protected inputSchema = z.any();

  readonly #documentGateway: DocumentGateway;

  readonly #uuidGenerator: UuidGenerator;

  constructor(documentGateway: DocumentGateway, uuidGenerator: UuidGenerator) {
    super();
    this.#documentGateway = documentGateway;
    this.#uuidGenerator = uuidGenerator;
  }

  protected async _execute({
    file,
    renameFileToId = true,
  }: UploadFileInput): Promise<AbsoluteUrl> {
    const fileToSave: StoredFile = {
      ...file,
      id: renameFileToId ? this.#replaceNameWithUuid(file) : file.name,
    };

    const existingFileUrl = await this.#documentGateway.getUrl(fileToSave.id);
    if (existingFileUrl) throw errors.file.fileAlreadyExist(fileToSave.id);

    await this.#documentGateway.save(fileToSave);

    const savedFile = await this.#documentGateway.getUrl(fileToSave.id);
    if (!savedFile) throw errors.file.missingFile(fileToSave.id);
    return savedFile;
  }

  #replaceNameWithUuid(file: FileInput) {
    const extension = file.name.split(".").at(-1);
    return `${this.#uuidGenerator.new()}.${extension}`;
  }
}
