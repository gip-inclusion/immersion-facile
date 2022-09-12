import { z } from "zod";
import { UnitOfWorkPerformer } from "../../../core/ports/UnitOfWork";
import { UuidGenerator } from "../../../core/ports/UuidGenerator";
import { TransactionalUseCase } from "../../../core/UseCase";
import { StoredFile } from "../entity/StoredFile";
import { DocumentGateway } from "../port/DocumentGateway";

type MulterFile = {
  originalname: string;
  encoding: string;
  size: number;
  path: string;
};

export class UploadLogo extends TransactionalUseCase<MulterFile, string> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly documentGateway: DocumentGateway,
    private readonly uuidGenerator: UuidGenerator,
  ) {
    super(uowPerformer);
  }

  inputSchema = z.any();

  protected async _execute(multerFile: MulterFile): Promise<string> {
    const file: StoredFile = {
      id: this.uuidGenerator.new(),
      name: multerFile.originalname,
      encoding: multerFile.encoding,
      size: multerFile.size,
      path: multerFile.path,
    };
    await this.documentGateway.put(file);
    return this.documentGateway.getFileUrl(file);
  }
}
