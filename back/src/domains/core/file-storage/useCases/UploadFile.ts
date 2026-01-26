import {
  type AbsoluteUrl,
  type ConnectedUser,
  errors,
  validateFile,
  type ZodSchemaWithInputMatchingOutput,
  zStringMinLength1,
} from "shared";
import { z } from "zod";

import { useCaseBuilder } from "../../useCaseBuilder";
import type { UuidGenerator } from "../../uuid-generator/ports/UuidGenerator";
import type { StoredFile } from "../entity/StoredFile";
import type { DocumentGateway } from "../port/DocumentGateway";

export type FileInput = Omit<StoredFile, "id">;

type UploadFileInput = {
  file: FileInput;
};

// biome-ignore lint/correctness/noUnusedVariables: <explanation>
const uploadFileInput: ZodSchemaWithInputMatchingOutput<UploadFileInput> =
  z.object({
    file: z.object({
      name: zStringMinLength1,
      encoding: zStringMinLength1,
      size: z.number(),
      buffer: z.instanceof(Buffer), // class not supported by NarrowEvent<Topic>["payload"]
      mimetype: zStringMinLength1,
    }),
  });

export type UploadFile = ReturnType<typeof makeUploadFile>;

export const makeUploadFile = useCaseBuilder("UploadFile")
  .notTransactional()
  .withInput<any>(z.any())
  .withOutput<AbsoluteUrl>()
  .withCurrentUser<ConnectedUser>()
  .withDeps<{
    documentGateway: DocumentGateway;
    uuidGenerator: UuidGenerator;
  }>()
  .build(async ({ inputParams: { file }, deps, currentUser }) => {
    throwIfUserIsNotAdminNorAgencyAdmin(currentUser);

    const validationResult = validateFile(
      {
        ...file,
        type: file.mimetype,
      },
      file.buffer,
    );
    if (validationResult !== true)
      throw errors.file.invalidFile(validationResult);

    const fileToSave: StoredFile = {
      ...file,
      id: replaceNameWithUuid(deps.uuidGenerator, file),
    };

    const existingFileUrl = await deps.documentGateway.getUrl(fileToSave.id);
    if (existingFileUrl) throw errors.file.fileAlreadyExist(fileToSave.id);

    await deps.documentGateway.save(fileToSave);

    const savedFile = await deps.documentGateway.getUrl(fileToSave.id);
    if (!savedFile) throw errors.file.missingFile(fileToSave.id);
    return savedFile;
  });

const throwIfUserIsNotAdminNorAgencyAdmin = (
  currentUser: ConnectedUser,
): void | never => {
  if (!currentUser) throw errors.user.unauthorized();
  if (currentUser.isBackofficeAdmin) return;

  const isAgencyAdmin = currentUser.agencyRights.some((agencyRight) =>
    agencyRight.roles.includes("agency-admin"),
  );
  if (!isAgencyAdmin) throw errors.user.forbidden({ userId: currentUser.id });
  return;
};

const replaceNameWithUuid = (
  uuidGeneratorGateway: UuidGenerator,
  file: FileInput,
): string => {
  const extension = file.name.split(".").at(-1);
  return `${uuidGeneratorGateway.new()}.${extension}`;
};
