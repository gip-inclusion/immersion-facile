import {
  ConventionJwtPayload,
  ConventionRelatedJwtPayload,
  zStringMinLength1,
} from "shared";
import { UnauthorizedError } from "../../../../config/helpers/httpErrors";
import { UseCase } from "../../UseCase";
import { PdfGeneratorGateway } from "../ports/PdfGeneratorGateway";

export class HtmlToPdf extends UseCase<string, string, ConventionJwtPayload> {
  protected inputSchema = zStringMinLength1;

  constructor(protected pdfGeneratorGateway: PdfGeneratorGateway) {
    super();
  }

  protected async _execute(
    htmlContent: string,
    jwtPayload?: ConventionRelatedJwtPayload,
  ): Promise<string> {
    if (!jwtPayload) throw new UnauthorizedError();
    return this.pdfGeneratorGateway.make(htmlContent);
  }
}
