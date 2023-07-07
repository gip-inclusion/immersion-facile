import { createTarget, createTargets } from "http-client";
import { contactEstablishmentRequestSchema } from "../contactEstablishmentRequest/contactEstablishmentRequest.schema";
import {
  contactEstablishmentRoute,
  immersionOffersRoute,
} from "../routes/routes";
import { searchImmersionQueryParamsSchema } from "./SearchImmersionQueryParams.schema";
import { searchImmersionsSchema } from "./SearchImmersionResult.schema";

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
