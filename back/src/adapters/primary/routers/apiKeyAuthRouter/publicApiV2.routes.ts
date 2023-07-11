import {
  contactEstablishmentRequestSchema,
  searchImmersionsSchema,
} from "shared";
import { defineRoute, defineRoutes } from "shared-routes";
import { searchImmersionRequestPublicV2Schema } from "../DtoAndSchemas/v2/input/SearchImmersionRequestPublicV2.schema";

export const publicApiV2Routes = defineRoutes({
  getOffersBySiretAndAppellationCode: defineRoute({
    method: "get",
    url: "/v2/immersion-offers/:siret/:appellationCode",
    responses: { 200: searchImmersionsSchema },
  }),
  searchImmersion: defineRoute({
    method: "get",
    url: "/v2/immersion-offers",
    queryParamsSchema: searchImmersionRequestPublicV2Schema,
    responses: { 200: searchImmersionsSchema },
  }),
  contactEstablishment: defineRoute({
    method: "post",
    url: "/v2/contact-establishment",
    requestBodySchema: contactEstablishmentRequestSchema,
  }),
});
