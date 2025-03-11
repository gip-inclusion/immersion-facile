import type { HtmlToPdfRequest } from "shared";
import type { PdfGeneratorGateway } from "../ports/PdfGeneratorGateway";

export class InMemoryPdfGeneratorGateway implements PdfGeneratorGateway {
  public async make({
    htmlContent,
    conventionId,
  }: HtmlToPdfRequest): Promise<string> {
    return `PDF_OF convention ${conventionId} >> "${htmlContent}"`;
  }
}
