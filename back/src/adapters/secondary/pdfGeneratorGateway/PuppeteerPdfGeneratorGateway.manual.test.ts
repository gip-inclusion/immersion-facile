import { existsSync } from "fs";
import { arrayFromNumber } from "shared";
import { TestUuidGenerator } from "../core/UuidGeneratorImplementations";
import { PuppeteerPdfGeneratorGateway } from "./PuppeteerPdfGeneratorGateway";

describe("PuppeteerPdfGeneratorGateway", () => {
  it(`make 10 pdf simultaneously`, async () => {
    await Promise.all(
      arrayFromNumber(10).map(async (_, index) => {
        const uuidGenerator = new TestUuidGenerator([index.toString()]);
        const fileName = `result_${index.toString()}.pdf`;
        const pdfGeneratorGateway = new PuppeteerPdfGeneratorGateway(
          uuidGenerator,
        );
        const pdfBase64 = await pdfGeneratorGateway.make("TEST");
        expect(pdfBase64).toBeDefined();
        expect(pdfBase64.length).toBeGreaterThan(0);
        expect(Buffer.from(pdfBase64, "base64").toString("binary")).toContain(
          "%PDF",
        );
        expect(existsSync(fileName)).toBeFalsy();
      }),
    );
  });
});
