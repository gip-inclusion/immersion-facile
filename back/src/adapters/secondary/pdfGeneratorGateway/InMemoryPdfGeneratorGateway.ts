import { PdfGeneratorGateway } from "../../../domain/generic/htmlToPdf/PdfGeneratorGateway";

export class InMemoryPdfGeneratorGateway implements PdfGeneratorGateway {
  public async make(htmlContent: string): Promise<string> {
    return `PDF_OF >> "${htmlContent}"`;
  }
}
