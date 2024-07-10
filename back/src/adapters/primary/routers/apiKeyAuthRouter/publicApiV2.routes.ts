import {
  createPaginatedSchema,
  createWebhookSubscriptionSchema,
  emptyObjectSchema,
  expressEmptyResponseBody,
  httpErrorSchema,
  paginationQueryParamsSchema,
  searchResultSchema,
  searchResultsSchema,
  withAuthorizationHeaders,
} from "shared";
import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import { EstablishmentStat } from "../../../../domains/core/statistics/use-cases/GetEstablishmentStats";
import { contactEstablishmentPublicV2Schema } from "../DtoAndSchemas/v2/input/ContactEstablishmentPublicV2.schema";
import { conventionReadPublicV2Schema } from "../DtoAndSchemas/v2/input/ConventionReadPublicV2.schema";
import { getConventionsByFiltersQueryParamsV2Schema } from "../DtoAndSchemas/v2/input/GetConventionByFiltersQueriesV2.schema";
import { searchParamsPublicV2Schema } from "../DtoAndSchemas/v2/input/SearchParamsPublicV2.schema";

export type PublicApiV2SearchEstablishmentRoutes =
  typeof publicApiV2SearchEstablishmentRoutes;
export const publicApiV2SearchEstablishmentRoutes = defineRoutes({
  getOfferBySiretAndAppellationCode: defineRoute({
    method: "get",
    url: "/v2/search/:siret/:appellationCode",
    ...withAuthorizationHeaders,
    responses: {
      200: searchResultSchema,
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      404: httpErrorSchema,
      429: httpErrorSchema,
    },
  }),
  searchImmersion: defineRoute({
    method: "get",
    url: "/v2/search",
    queryParamsSchema: searchParamsPublicV2Schema,
    ...withAuthorizationHeaders,
    responses: {
      200: searchResultsSchema,
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      429: httpErrorSchema,
    },
  }),
  contactEstablishment: defineRoute({
    method: "post",
    url: "/v2/contact-establishment",
    requestBodySchema: contactEstablishmentPublicV2Schema,
    ...withAuthorizationHeaders,
    responses: {
      201: z.void(),
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      404: httpErrorSchema,
      429: httpErrorSchema,
    },
  }),
});

export type PublicApiV2ConventionRoutes = typeof publicApiV2ConventionRoutes;
export const publicApiV2ConventionRoutes = defineRoutes({
  getConventionById: defineRoute({
    method: "get",
    url: "/v2/conventions/:conventionId",
    ...withAuthorizationHeaders,
    responses: {
      200: conventionReadPublicV2Schema,
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      404: httpErrorSchema,
      429: httpErrorSchema,
    },
  }),
  getConventions: defineRoute({
    method: "get",
    url: "/v2/conventions",
    queryParamsSchema: getConventionsByFiltersQueryParamsV2Schema,
    ...withAuthorizationHeaders,
    responses: {
      200: z.array(conventionReadPublicV2Schema),
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      429: httpErrorSchema,
    },
  }),
});

const establishmentStatSchema: z.Schema<EstablishmentStat> = z.object({
  siret: z.string(),
  name: z.string(),
  numberOfConventions: z.number(),
  isReferenced: z.boolean(),
});

export const paginatedEstablishmentStatsSchema = createPaginatedSchema(
  establishmentStatSchema,
);

export type PublicApiV2StatisticsRoutes = typeof publicApiV2StatisticsRoutes;
export const publicApiV2StatisticsRoutes = defineRoutes({
  getEstablishmentStats: defineRoute({
    method: "get",
    url: "/v2/statistics/establishments",
    queryParamsSchema: paginationQueryParamsSchema,
    ...withAuthorizationHeaders,
    responses: {
      200: paginatedEstablishmentStatsSchema,
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      429: httpErrorSchema,
    },
  }),
});

export type PublicApiV2WebhooksRoutes = typeof publicApiV2WebhooksRoutes;
export const publicApiV2WebhooksRoutes = defineRoutes({
  subscribeToWebhook: defineRoute({
    method: "post",
    url: "/v2/webhooks",
    requestBodySchema: createWebhookSubscriptionSchema,
    ...withAuthorizationHeaders,
    responses: {
      201: expressEmptyResponseBody,
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      429: httpErrorSchema,
    },
  }),
  listActiveSubscriptions: defineRoute({
    method: "get",
    url: "/v2/webhooks",
    ...withAuthorizationHeaders,
    responses: {
      200: z.array(
        createWebhookSubscriptionSchema.and(
          z.object({
            id: z.string(),
            createdAt: z.string().datetime(),
          }),
        ),
      ),
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      429: httpErrorSchema,
    },
  }),
  unsubscribeToWebhook: defineRoute({
    method: "delete",
    url: "/v2/webhooks/:subscriptionId",
    ...withAuthorizationHeaders,
    responses: {
      204: emptyObjectSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      404: httpErrorSchema,
      429: httpErrorSchema,
    },
  }),
});
