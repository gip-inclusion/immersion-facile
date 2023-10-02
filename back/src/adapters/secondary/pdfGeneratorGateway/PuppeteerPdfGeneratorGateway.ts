import { unlinkSync } from "fs";
import { launch } from "puppeteer";
import { UuidGenerator } from "../../../domain/core/ports/UuidGenerator";
import { PdfGeneratorGateway } from "../../../domain/generic/htmlToPdf/PdfGeneratorGateway";

export class PuppeteerPdfGeneratorGateway implements PdfGeneratorGateway {
  constructor(private readonly uuidGenerator: UuidGenerator) {}

  public async make(htmlContent: string): Promise<string> {
    const browser = await launch({
      headless: "new",
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "load" });
    await page.emulateMediaType("print");

    const fileName = `result_${this.uuidGenerator.new()}.pdf`;
    const base64Pdf = (
      await page.pdf({
        path: fileName,
        margin: { top: "80px", right: "50px", bottom: "80px", left: "50px" },
        printBackground: true,
        format: "A4",
      })
    ).toString("base64");

    unlinkSync(fileName);
    await page.close();
    await browser.close();

    return base64Pdf;
  }
}
