import Bottleneck from "bottleneck";
import { unlinkSync } from "fs";
import { launch } from "puppeteer";
import { UuidGenerator } from "../../../domain/core/ports/UuidGenerator";
import { PdfGeneratorGateway } from "../../../domain/generic/htmlToPdf/PdfGeneratorGateway";

export class PuppeteerPdfGeneratorGateway implements PdfGeneratorGateway {
  #limiter = new Bottleneck({
    maxConcurrent: 1,
  });

  constructor(private readonly uuidGenerator: UuidGenerator) {}

  public async make(htmlContent: string): Promise<string> {
    return this.#limiter.schedule(() => this.#executePuppeteerJob(htmlContent));
  }

  async #executePuppeteerJob(htmlContent: string) {
    const browser = await launch({
      headless: "new",
      args: ["--no-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "load" });
    await page.emulateMediaType("print");

    const fileName = `result_${this.uuidGenerator.new()}.pdf`;
    const base64Pdf = (
      await page.pdf({
        path: fileName,
        margin: {
          top: "2.5cm",
          right: "1.5cm",
          bottom: "2.5cm",
          left: "1.5cm",
        },
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
