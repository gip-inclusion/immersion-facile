import { z } from "zod";
import {
  searchImmersionResultSchema,
  searchImmersionsSchema,
  withAuthorizationHeaders,
} from "shared";
import { defineRoute, defineRoutes } from "shared-routes";
import { contactEstablishmentPublicV2Schema } from "../DtoAndSchemas/v2/input/ContactEstablishmentPublicV2.schema";
import { searchImmersionRequestPublicV2Schema } from "../DtoAndSchemas/v2/input/SearchImmersionRequestPublicV2.schema";

export type PublicApiV2Routes = typeof publicApiV2Routes;
export const publicApiV2Routes = defineRoutes({
  getOfferBySiretAndAppellationCode: defineRoute({
    method: "get",
    url: "/v2/offers/:siret/:appellationCode",
    ...withAuthorizationHeaders,
    responses: {
      200: searchImmersionResultSchema,
      401: z.object({
        status: z.number(),
        message: z.string(),
        issues: z.array(z.string()).optional(),
      }),
      403: z.object({
        status: z.number(),
        message: z.string(),
        issues: z.array(z.string()).optional(),
      }),
      404: z.object({
        status: z.number(),
        message: z.string(),
        issues: z.array(z.string()).optional(),
      }),
    },
  }),
  searchImmersion: defineRoute({
    method: "get",
    url: "/v2/offers",
    queryParamsSchema: searchImmersionRequestPublicV2Schema,
    ...withAuthorizationHeaders,
    responses: {
      200: searchImmersionsSchema,
      400: z.object({
        status: z.number(),
        message: z.string(),
        issues: z.array(z.string()).optional(),
      }),
      401: z.object({
        status: z.number(),
        message: z.string(),
        issues: z.array(z.string()).optional(),
      }),
      403: z.object({
        status: z.number(),
        message: z.string(),
        issues: z.array(z.string()).optional(),
      }),
    },
  }),
  contactEstablishment: defineRoute({
    method: "post",
    url: "/v2/contact-establishment",
    requestBodySchema: contactEstablishmentPublicV2Schema,
    ...withAuthorizationHeaders,
    responses: {
      201: z.void(),
      400: z.object({
        status: z.number(),
        message: z.string(),
        issues: z.array(z.string()).optional(),
      }),
      401: z.object({
        status: z.number(),
        message: z.string(),
        issues: z.array(z.string()).optional(),
      }),
      403: z.object({
        status: z.number(),
        message: z.string(),
        issues: z.array(z.string()).optional(),
      }),
      404: z.object({
        status: z.number(),
        message: z.string(),
        issues: z.array(z.string()).optional(),
      }),
    },
  }),
});
