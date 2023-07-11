import { defineRoute, defineRoutes } from "shared-routes";
import { contactEstablishmentRequestSchema } from "../contactEstablishmentRequest/contactEstablishmentRequest.schema";
import {
  contactEstablishmentRoute,
  immersionOffersRoute,
} from "../routes/routes";
import { searchImmersionQueryParamsSchema } from "./SearchImmersionQueryParams.schema";
import { searchImmersionsSchema } from "./SearchImmersionResult.schema";

export type SearchTargets = typeof searchTargets;
export const searchTargets = defineRoutes({
  getOffersByGroupSlug: defineRoute({
    method: "get",
    url: `/group-offers/:groupSlug`,
    responses: { 200: searchImmersionsSchema },
  }),
  searchImmersion: defineRoute({
    method: "get",
    url: `/${immersionOffersRoute}`,
    queryParamsSchema: searchImmersionQueryParamsSchema,
    responses: { 200: searchImmersionsSchema },
  }),
  contactEstablishment: defineRoute({
    method: "post",
    url: `/${contactEstablishmentRoute}`,
    requestBodySchema: contactEstablishmentRequestSchema,
  }),
});
