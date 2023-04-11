import { createTarget, createTargets } from "http-client";
import { contactEstablishmentRequestSchema } from "../contactEstablishmentRequest/contactEstablishmentRequest.schema";
import { searchImmersionQueryParamsSchema } from "../searchImmersion/SearchImmersionQueryParams.schema";
import { searchImmersionsSchema } from "../searchImmersion/SearchImmersionResult.schema";
import { contactEstablishmentRoute, immersionOffersRoute } from "./routes";

export type SearchTargets = typeof searchTargets;
export const searchTargets = createTargets({
  getOffersByGroupSlug: createTarget({
    method: "GET",
    url: "/group-offers/:groupSlug",
    validateResponseBody: searchImmersionsSchema.parse,
  }),
  searchImmersion: createTarget({
    method: "GET",
    url: `/${immersionOffersRoute}`,
    validateQueryParams: searchImmersionQueryParamsSchema.parse,
    validateResponseBody: searchImmersionsSchema.parse,
  }),
  contactEstablishment: createTarget({
    method: "POST",
    url: `/${contactEstablishmentRoute}`,
    validateRequestBody: contactEstablishmentRequestSchema.parse,
  }),
});
