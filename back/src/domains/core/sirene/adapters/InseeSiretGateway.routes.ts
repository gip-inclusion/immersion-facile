import { AbsoluteUrl } from "shared";
import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import { SirenGatewayAnswer } from "./InseeSiretGateway";

// The documentation can be found here:
// https://portail-api.insee.fr/catalog/all > Api Sirene Privée > Documentation

export type InseeExternalRoutes = ReturnType<typeof makeInseeExternalRoutes>;
export const makeInseeExternalRoutes = (endpoint: AbsoluteUrl) =>
  defineRoutes({
    getAccessToken: defineRoute({
      method: "post",
      url: "https://auth.insee.net/auth/realms/apim-gravitee/protocol/openid-connect/token",
      headersSchema: z.object({
        "Content-Type": z.literal("application/x-www-form-urlencoded"),
      }),
      requestBodySchema: z.string(),
      responses: {
        [200]: z.any(),
        [401]: z.any(),
      },
    }),
    getEstablishmentUpdatedBetween: defineRoute({
      method: "post",
      url: `${endpoint}/siret`,
      headersSchema: z.object({
        "Content-Type": z.literal("application/x-www-form-urlencoded"),
        Accept: z.literal("application/json"),
        Authorization: z.string(),
      }),
      requestBodySchema: z.string(),
      responses: {
        [200]: siretGatewayAnswerSchema,
        [404]: z.object({ yo: z.string() }),
        [429]: z.string(),
        [503]: z.string(),
      },
    }),
    getEstablishmentBySiret: defineRoute({
      method: "get",
      url: `${endpoint}/siret`,
      headersSchema: z.object({
        "Content-Type": z.literal("application/x-www-form-urlencoded"),
        Accept: z.literal("application/json"),
        Authorization: z.string(),
      }),
      queryParamsSchema: z.object({
        q: z.string(),
        date: z.string().optional(),
      }),
      responses: {
        [200]: siretGatewayAnswerSchema,
        [404]: z.object({ yo: z.string() }),
        [429]: z.string(),
        [503]: z.string(),
      },
    }),
  });

const siretGatewayAnswerSchema: z.Schema<SirenGatewayAnswer> = z.any();
