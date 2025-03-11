import type { AbsoluteUrl } from "shared";
import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import type { SirenGatewayAnswer } from "./InseeSiretGateway";

// The documentation can be found here:
// https://portail-api.insee.fr/catalog/all > Api Sirene Privée > Documentation

const inseeErrorSchema = z.object({
  header: z.object({
    statut: z.number(),
    message: z.string(),
  }),
});

const getAccessTokenError = z.object({
  error: z.string(),
  error_description: z.string(),
});

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
        [400]: getAccessTokenError,
        [401]: getAccessTokenError,
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
        [400]: inseeErrorSchema,
        [404]: inseeErrorSchema,
        [429]: inseeErrorSchema,
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
        [400]: inseeErrorSchema,
        [404]: inseeErrorSchema,
        [429]: inseeErrorSchema,
        [503]: z.any(),
      },
    }),
  });

const siretGatewayAnswerSchema: z.Schema<SirenGatewayAnswer> = z.any();
