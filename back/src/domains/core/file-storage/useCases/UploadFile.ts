import {
  AbsoluteUrl,
  InclusionConnectedUser,
  errors,
  validateFile,
  zStringMinLength1,
} from "shared";
import { z } from "zod";
import { UseCase } from "../../UseCase";
import { UuidGenerator } from "../../uuid-generator/ports/UuidGenerator";
import type { StoredFile } from "../entity/StoredFile";
import { DocumentGateway } from "../port/DocumentGateway";

export type FileInput = Omit<StoredFile, "id">;

export type UploadFileInput = {
  file: FileInput;
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
});

export class UploadFile extends UseCase<
  UploadFileInput,
  AbsoluteUrl,
  InclusionConnectedUser
> {
  protected inputSchema = z.any();

  readonly #documentGateway: DocumentGateway;

  readonly #uuidGenerator: UuidGenerator;

  constructor(documentGateway: DocumentGateway, uuidGenerator: UuidGenerator) {
    super();
    this.#documentGateway = documentGateway;
    this.#uuidGenerator = uuidGenerator;
  }

  protected async _execute(
    { file }: UploadFileInput,
    connectedUser: InclusionConnectedUser,
  ): Promise<AbsoluteUrl> {
    if (!connectedUser) throw errors.user.unauthorized();

    const isAdminOrAgencyAdmin =
      throwIfUserIsNotAdminNorAgencyAdmin(connectedUser);

    if (!isAdminOrAgencyAdmin)
      throw errors.user.forbidden({ userId: connectedUser.id });

    const validationResult = validateFile({
      ...file,
      type: file.mimetype,
    });
    if (validationResult !== true)
      throw errors.file.invalidFile(validationResult);

    const fileToSave: StoredFile = {
      ...file,
      id: this.#replaceNameWithUuid(file),
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

const throwIfUserIsNotAdminNorAgencyAdmin = (
  currentUser: InclusionConnectedUser,
): boolean => {
  if (!currentUser) throw errors.user.unauthorized();
  if (currentUser.isBackofficeAdmin) return true;

  const isAgencyAdmin = currentUser.agencyRights.some((agencyRight) =>
    agencyRight.roles.includes("agency-admin"),
  );

  return isAgencyAdmin;
};
