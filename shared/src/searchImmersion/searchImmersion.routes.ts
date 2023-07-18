import { z } from "zod";
import { defineRoute, defineRoutes } from "shared-routes";
import { contactEstablishmentRequestSchema } from "../contactEstablishmentRequest/contactEstablishmentRequest.schema";
import { httpErrorSchema } from "../httpClient/errors/httpErrors.schema";
import {
  contactEstablishmentRoute,
  immersionOffersRoute,
} from "../routes/routes";
import { searchImmersionQueryParamsSchema } from "./SearchImmersionQueryParams.schema";
import { searchImmersionsSchema } from "./SearchImmersionResult.schema";

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
      400: httpErrorSchema,
    },
  }),
  contactEstablishment: defineRoute({
    method: "post",
    url: `/${contactEstablishmentRoute}`,
    requestBodySchema: contactEstablishmentRequestSchema,
    responses: {
      201: z.string().max(0),
      400: httpErrorSchema,
      404: httpErrorSchema,
    },
  }),
});
