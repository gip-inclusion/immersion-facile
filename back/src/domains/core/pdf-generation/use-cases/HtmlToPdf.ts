import {
  type ConnectedUserDomainJwtPayload,
  type ConventionJwtPayload,
  errors,
  type HtmlToPdfRequest,
  htmlToPdfRequestSchema,
} from "shared";
import { UseCase } from "../../UseCase";
import type { PdfGeneratorGateway } from "../ports/PdfGeneratorGateway";

export class HtmlToPdf extends UseCase<
  HtmlToPdfRequest,
  string,
  ConventionJwtPayload | ConnectedUserDomainJwtPayload
> {
  protected inputSchema = htmlToPdfRequestSchema;

  constructor(protected pdfGeneratorGateway: PdfGeneratorGateway) {
    super();
  }

  protected async _execute(
    params: HtmlToPdfRequest,
    jwtPayload?: ConventionJwtPayload | ConnectedUserDomainJwtPayload,
  ): Promise<string> {
    if (!jwtPayload) throw errors.user.unauthorized();
    return this.pdfGeneratorGateway.make(params);
  }
}
