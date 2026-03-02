import {
  type ConnectedUserDomainJwtPayload,
  type ConventionJwtPayload,
  errors,
  type HtmlToPdfRequest,
  htmlToPdfRequestSchema,
  stripUnsafeHtmlForPdf,
} from "shared";
import { useCaseBuilder } from "../../useCaseBuilder";
import type { PdfGeneratorGateway } from "../ports/PdfGeneratorGateway";

export type HtmlToPdf = ReturnType<typeof makeHtmlToPdf>;

export const makeHtmlToPdf = useCaseBuilder("HtmlToPdf")
  .notTransactional()
  .withInput<HtmlToPdfRequest>(htmlToPdfRequestSchema)
  .withOutput<string>()
  .withCurrentUser<ConventionJwtPayload | ConnectedUserDomainJwtPayload>()
  .withDeps<{
    pdfGeneratorGateway: PdfGeneratorGateway;
  }>()
  .build(async ({ inputParams, deps, currentUser }) => {
    if (!currentUser) throw errors.user.unauthorized();
    const sanitizedHtmlContent = stripUnsafeHtmlForPdf(inputParams.htmlContent);
    return deps.pdfGeneratorGateway.make({
      ...inputParams,
      htmlContent: sanitizedHtmlContent,
    });
  });
