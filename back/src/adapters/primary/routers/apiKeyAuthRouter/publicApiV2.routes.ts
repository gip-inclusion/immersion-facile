import {
  createPaginatedSchema,
  createWebhookSubscriptionSchema,
  emptyObjectSchema,
  expressEmptyResponseBody,
  httpErrorSchema,
  localization,
  makeDateStringSchema,
  paginationQueryParamsSchema,
  withAuthorizationHeaders,
  type ZodSchemaWithInputMatchingOutput,
} from "shared";
import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import type { EstablishmentStat } from "../../../../domains/core/statistics/use-cases/GetEstablishmentStats";
import {
  conventionReadPublicListV2Schema,
  conventionReadPublicV2Schema,
} from "../DtoAndSchemas/v2/input/ConventionReadPublicV2.schema";
import { getConventionsByFiltersQueryParamsV2Schema } from "../DtoAndSchemas/v2/input/GetConventionByFiltersQueriesV2.schema";

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
      200: conventionReadPublicListV2Schema,
      400: httpErrorSchema,
      401: httpErrorSchema,
      403: httpErrorSchema,
      429: httpErrorSchema,
    },
  }),
});

const establishmentStatSchema: ZodSchemaWithInputMatchingOutput<EstablishmentStat> =
  z.object({
    siret: z.string(),
    name: z.string(),
    numberOfConventions: z.number(),
    isReferenced: z.boolean(),
    referencedAt: makeDateStringSchema(),
  });

const paginatedEstablishmentStatsSchema = createPaginatedSchema(
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
            createdAt: z.iso.datetime({
              error: localization.invalidDate,
            }),
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
