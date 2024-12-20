import {
  ConventionJwtPayload,
  ConventionRelatedJwtPayload,
  errors,
  zStringMinLength1,
} from "shared";
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
    if (!jwtPayload) throw errors.user.unauthorized();
    return this.pdfGeneratorGateway.make(htmlContent);
  }
}
