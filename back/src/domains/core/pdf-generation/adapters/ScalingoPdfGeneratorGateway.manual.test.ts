import { existsSync } from "node:fs";
import axios from "axios";
import { arrayFromNumber } from "shared";
import { createAxiosSharedClient } from "shared-routes/axios";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { TestUuidGenerator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";
import {
  ScalingoPdfGeneratorGateway,
  makeScalingoPdfGeneratorRoutes,
} from "./ScalingoPdfGeneratorGateway";

describe("ScalingoPdfGeneratorGateway", () => {
  it("make 10 pdf simultaneously", async () => {
    const config = AppConfig.createFromEnv();

    await Promise.all(
      arrayFromNumber(10).map(async (_, index) => {
        const uuidGenerator = new TestUuidGenerator([index.toString()]);
        const httpClient = createAxiosSharedClient(
          makeScalingoPdfGeneratorRoutes(config.pdfGenerator.baseUrl),
          axios,
        );
        const fileName = `result_${index.toString()}.pdf`;
        const pdfGeneratorGateway = new ScalingoPdfGeneratorGateway(
          httpClient,
          config.pdfGenerator.apiKey,
          uuidGenerator,
        );

        const pdfBase64 = await pdfGeneratorGateway.make({
          htmlContent: "TEST",
          conventionId: "osef",
        });
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
