import { z } from "zod";
import { FeatureDisabledError } from "../../../../adapters/primary/helpers/httpErrors";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { UuidGenerator } from "../../../core/ports/UuidGenerator";
import { TransactionalUseCase } from "../../../core/UseCase";
import { StoredFile } from "../entity/StoredFile";
import { DocumentGateway } from "../port/DocumentGateway";

type MulterFile = {
  originalname: string;
  encoding: string;
  size: number;
  buffer: Buffer;
};

export class UploadLogo extends TransactionalUseCase<MulterFile, string> {
  protected inputSchema = z.any();

  readonly #documentGateway: DocumentGateway;

  readonly #uuidGenerator: UuidGenerator;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    documentGateway: DocumentGateway,
    uuidGenerator: UuidGenerator,
  ) {
    super(uowPerformer);

    this.#documentGateway = documentGateway;
    this.#uuidGenerator = uuidGenerator;
  }

  protected async _execute(
    multerFile: MulterFile,
    uow: UnitOfWork,
  ): Promise<string> {
    const { enableLogoUpload } = await uow.featureFlagRepository.getAll();
    if (!enableLogoUpload.isActive) {
      throw new FeatureDisabledError("Upload Logo");
    }

    const extension = multerFile.originalname.split(".").at(-1);

    const file: StoredFile = {
      id: `${this.#uuidGenerator.new()}.${extension}`,
      name: multerFile.originalname,
      encoding: multerFile.encoding,
      size: multerFile.size,
      buffer: multerFile.buffer,
    };
    await this.#documentGateway.put(file);
    return this.#documentGateway.getFileUrl(file);
  }
}
