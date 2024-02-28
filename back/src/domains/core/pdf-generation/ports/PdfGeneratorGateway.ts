export interface PdfGeneratorGateway {
  make(htmlContent: string): Promise<string>;
}
