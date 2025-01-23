import { HtmlToPdfRequest } from "shared";
import { PdfGeneratorGateway } from "../ports/PdfGeneratorGateway";

export class InMemoryPdfGeneratorGateway implements PdfGeneratorGateway {
  public async make({
    htmlContent,
    conventionId,
  }: HtmlToPdfRequest): Promise<string> {
    return `PDF_OF convention ${conventionId} >> "${htmlContent}"`;
  }
}
