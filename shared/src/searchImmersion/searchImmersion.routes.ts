import { z } from "zod";
import { defineRoute, defineRoutes } from "shared-routes";
import { contactEstablishmentRequestSchema } from "../contactEstablishmentRequest/contactEstablishmentRequest.schema";
import {
  contactEstablishmentRoute,
  immersionOffersRoute,
} from "../routes/routes";
import { searchImmersionQueryParamsSchema } from "./SearchImmersionQueryParams.schema";
import { searchImmersionsSchema } from "./SearchImmersionResult.schema";

const errorSchema = z.object({
  status: z.number(),
  message: z.string(),
  issues: z.array(z.string()).optional(),
});

export type SearchImmersionRoutes = typeof searchImmersionRoutes;
export const searchImmersionRoutes = defineRoutes({
  getOffersByGroupSlug: defineRoute({
    method: "get",
    url: `/group-offers/:groupSlug`,
    responses: { 200: searchImmersionsSchema },
  }),
  searchImmersion: defineRoute({
    method: "get",
    url: `/${immersionOffersRoute}`,
    queryParamsSchema: searchImmersionQueryParamsSchema,
    responses: {
      200: searchImmersionsSchema,
      400: errorSchema,
    },
  }),
  contactEstablishment: defineRoute({
    method: "post",
    url: `/${contactEstablishmentRoute}`,
    requestBodySchema: contactEstablishmentRequestSchema,
    responses: { 201: z.string().max(0), 400: errorSchema, 404: errorSchema },
  }),
});
