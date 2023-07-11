import { z } from "zod";
import {
  contactEstablishmentRequestSchema,
  searchImmersionsSchema,
  withAuthorizationHeaders,
} from "shared";
import { defineRoute, defineRoutes } from "shared-routes";
import { searchImmersionRequestPublicV2Schema } from "../DtoAndSchemas/v2/input/SearchImmersionRequestPublicV2.schema";

export type PublicApiV2Routes = typeof publicApiV2Routes;
export const publicApiV2Routes = defineRoutes({
  getOffersBySiretAndAppellationCode: defineRoute({
    method: "get",
    url: "/v2/immersion-offers/:siret/:appellationCode",
    ...withAuthorizationHeaders,
    responses: {
      200: searchImmersionsSchema,
      401: z.object({ error: z.string() }),
      403: z.object({ error: z.string() }),
      404: z.object({ errors: z.string() }),
    },
  }),
  searchImmersion: defineRoute({
    method: "get",
    url: "/v2/immersion-offers",
    queryParamsSchema: searchImmersionRequestPublicV2Schema,
    ...withAuthorizationHeaders,
    responses: {
      200: searchImmersionsSchema,
      400: z.object({ message: z.string(), issues: z.array(z.string()) }),
      401: z.object({ error: z.string() }),
      403: z.object({ error: z.string() }),
      404: z.object({ errors: z.string() }),
    },
  }),
  contactEstablishment: defineRoute({
    method: "post",
    url: "/v2/contact-establishment",
    requestBodySchema: contactEstablishmentRequestSchema,
    ...withAuthorizationHeaders,
    responses: {
      201: z.void(),
      400: z
        .object({
          message: z.string(),
          issues: z.array(z.string()).optional(),
        })
        .or(
          z.object({
            errors: z.string(),
          }),
        ),
      401: z.object({ error: z.string() }),
      403: z.object({ error: z.string() }),
      404: z.object({ errors: z.string() }),
    },
  }),
});
