import { AbsoluteUrl, withAuthorizationHeaders } from "shared";
import { HttpClient, defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import { UuidGenerator } from "../../../domains/core/uuid-generator/ports/UuidGenerator";
import { PdfGeneratorGateway } from "../../../domains/generic/htmlToPdf/PdfGeneratorGateway";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

type ScalingoPdfGeneratorRoutes = ReturnType<
  typeof makeScalingoPdfGeneratorRoutes
>;
export const makeScalingoPdfGeneratorRoutes = (baseUrl: AbsoluteUrl) => {
  const url: AbsoluteUrl = `${baseUrl}/generate`;

  return defineRoutes({
    generate: defineRoute({
      method: "post",
      url,
      ...withAuthorizationHeaders,
      queryParamsSchema: z.object({
        request_id: z.string().optional(),
      }),
      requestBodySchema: z.object({
        htmlContent: z.string(),
      }),
      responses: {
        200: z.string(),
        401: z.string(),
      },
    }),
  });
};

export class ScalingoPdfGeneratorGateway implements PdfGeneratorGateway {
  #httpClient: HttpClient<ScalingoPdfGeneratorRoutes>;

  #apiKey: string;

  #uuidGenerator: UuidGenerator;

  constructor(
    httpClient: HttpClient<ScalingoPdfGeneratorRoutes>,
    apiKey: string,
    uuidGenerator: UuidGenerator,
  ) {
    this.#httpClient = httpClient;
    this.#apiKey = apiKey;
    this.#uuidGenerator = uuidGenerator;
  }

  public async make(htmlContent: string): Promise<string> {
    const requestId = this.#uuidGenerator.new();
    logger.info({ requestId }, "Generating pdf");

    const response = await this.#httpClient.generate({
      headers: { authorization: this.#apiKey },
      body: { htmlContent },
      queryParams: {
        request_id: requestId,
      },
    });

    if (response.status !== 200)
      throw new Error(
        `[requestId : ${requestId}] Pdf generation failed with status ${response.status} - ${response.body}`,
      );

    logger.info({ requestId }, "Pdf generated successfully");

    return response.body;
  }
}
