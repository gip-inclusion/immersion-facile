import { z } from "zod";
import { BadRequestError } from "../../../../adapters/primary/helpers/httpErrors";
import { UnitOfWorkPerformer } from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import { StoredFile } from "../entity/StoredFile";
import { DocumentGateway } from "../port/DocumentGateway";

export class UploadFile extends TransactionalUseCase<StoredFile, string> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly documentGateway: DocumentGateway,
  ) {
    super(uowPerformer);
  }

  inputSchema = z.any();

  protected async _execute(file: StoredFile): Promise<string> {
    if (!file) throw new BadRequestError("No file provided");
    await this.documentGateway.put(file);
    return this.documentGateway.getFileUrl(file.name);
  }
}
