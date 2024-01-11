import { z } from "zod";
import { UseCase } from "../../../core/UseCase";
import { uploadFileToGateway } from "../entity/StoredFile";
import { DocumentGateway } from "../port/DocumentGateway";

type MulterFile = {
  originalname: string;
  encoding: string;
  size: number;
  buffer: Buffer;
};

export class UploadFile extends UseCase<MulterFile, string> {
  protected inputSchema = z.any();

  readonly #documentGateway: DocumentGateway;

  constructor(documentGateway: DocumentGateway) {
    super();

    this.#documentGateway = documentGateway;
  }

  protected async _execute(multerFile: MulterFile): Promise<string> {
    return uploadFileToGateway(
      { fileId: multerFile.originalname, multerFile },
      this.#documentGateway,
    );
  }
}
