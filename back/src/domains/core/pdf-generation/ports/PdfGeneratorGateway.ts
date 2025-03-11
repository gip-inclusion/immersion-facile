import type { HtmlToPdfRequest } from "shared";

export interface PdfGeneratorGateway {
  make(params: HtmlToPdfRequest): Promise<string>;
}
