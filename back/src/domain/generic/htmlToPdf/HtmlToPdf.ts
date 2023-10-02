import { ConventionJwtPayload, zStringMinLength1 } from "shared";
import { UnauthorizedError } from "../../../adapters/primary/helpers/httpErrors";
import { UseCase } from "../../core/UseCase";
import { PdfGeneratorGateway } from "./PdfGeneratorGateway";

export class HtmlToPdf extends UseCase<string, string, ConventionJwtPayload> {
  protected inputSchema = zStringMinLength1;

  constructor(protected pdfGeneratorGateway: PdfGeneratorGateway) {
    super();
  }

  protected async _execute(
    htmlContent: string,
    jwtPayload?: ConventionJwtPayload,
  ): Promise<string> {
    if (!jwtPayload) throw new UnauthorizedError();
    return this.pdfGeneratorGateway.make(htmlContent);
  }
}
