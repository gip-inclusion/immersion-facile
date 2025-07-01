import {
  type ConventionJwtPayload,
  type ConventionRelatedJwtPayload,
  errors,
  type HtmlToPdfRequest,
  htmlToPdfRequestSchema,
} from "shared";
import { UseCase } from "../../UseCase";
import type { PdfGeneratorGateway } from "../ports/PdfGeneratorGateway";

export class HtmlToPdf extends UseCase<
  HtmlToPdfRequest,
  string,
  ConventionJwtPayload
> {
  protected inputSchema = htmlToPdfRequestSchema;

  constructor(protected pdfGeneratorGateway: PdfGeneratorGateway) {
    super();
  }

  protected async _execute(
    params: HtmlToPdfRequest,
    jwtPayload?: ConventionRelatedJwtPayload,
  ): Promise<string> {
    if (!jwtPayload) throw errors.user.unauthorized();
    return this.pdfGeneratorGateway.make(params);
  }
}
