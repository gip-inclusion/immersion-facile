import { z } from "zod";
import { defineRoute, defineRoutes } from "shared-routes";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { withAgencyIdSchema } from "../agency/agency.schema";
import {
  apiConsumerJwtSchema,
  apiConsumerSchema,
} from "../apiConsumer/apiConsumer.schema";
import { setFeatureFlagSchema } from "../featureFlags";
import {
  establishmentBatchReportSchema,
  formEstablishmentBatchSchema,
} from "../formEstablishment/FormEstablishment.schema";
import { withAuthorizationHeaders } from "../headers";
import {
  httpErrorSchema,
  legacyBadRequestErrorSchema,
  legacyUnauthenticatedErrorSchema,
} from "../httpClient/errors/httpErrors.schema";
import { inclusionConnectedUserSchema } from "../inclusionConnectedAllowed/inclusionConnectedAllowed.schema";
import { notificationsByKindSchema } from "../notifications/notifications.schema";
import { featureFlagsRoute } from "../routes/routes";
import { backOfficeJwtSchema } from "../tokens/jwtPayload.schema";
import { emptyStringSchema } from "../zodUtils";
import {
  icUserRoleForAgencyParamsSchema,
  userAndPasswordSchema,
  withAgencyRoleSchema,
} from "./admin.schema";

export type AdminRoutes = typeof adminRoutes;
export const adminRoutes = defineRoutes({
  login: defineRoute({
    method: "post",
    url: "/admin/login",
    requestBodySchema: userAndPasswordSchema,
    responses: {
      200: backOfficeJwtSchema,
      403: httpErrorSchema,
    },
  }),
  getDashboardUrl: defineRoute({
    method: "get",
    url: "/admin/dashboard/:dashboardName",
    queryParamsSchema: withAgencyIdSchema.partial(),
    ...withAuthorizationHeaders,
    responses: {
      200: absoluteUrlSchema,
      400: httpErrorSchema,
      401: httpErrorSchema,
    },
  }),
  addFormEstablishmentBatch: defineRoute({
    method: "post",
    url: "/admin/add-form-establishment-batch",
    requestBodySchema: formEstablishmentBatchSchema,
    ...withAuthorizationHeaders,
    responses: { 200: establishmentBatchReportSchema },
  }),
  updateUserRoleForAgency: defineRoute({
    method: "patch",
    url: "/admin/inclusion-connected/users",
    requestBodySchema: icUserRoleForAgencyParamsSchema,
    ...withAuthorizationHeaders,
    responses: {
      201: emptyStringSchema,
      401: legacyUnauthenticatedErrorSchema,
      404: legacyBadRequestErrorSchema,
    },
  }),
  getInclusionConnectedUsers: defineRoute({
    method: "get",
    url: "/admin/inclusion-connected/users",
    queryParamsSchema: withAgencyRoleSchema,
    ...withAuthorizationHeaders,
    responses: {
      200: z.array(inclusionConnectedUserSchema),
      401: legacyUnauthenticatedErrorSchema,
    },
  }),
  getLastNotifications: defineRoute({
    method: "get",
    url: "/admin/notifications",
    ...withAuthorizationHeaders,
    responses: { 200: notificationsByKindSchema },
  }),
  updateFeatureFlags: defineRoute({
    method: "post",
    url: `/admin/${featureFlagsRoute}`,
    ...withAuthorizationHeaders,
    requestBodySchema: setFeatureFlagSchema,
    responses: {
      201: emptyStringSchema,
      401: legacyUnauthenticatedErrorSchema,
    },
  }),
  saveApiConsumer: defineRoute({
    method: "post",
    url: `/admin/api-consumers`,
    requestBodySchema: apiConsumerSchema,
    ...withAuthorizationHeaders,
    responses: {
      200: apiConsumerJwtSchema,
      401: legacyUnauthenticatedErrorSchema,
    },
  }),
  getAllApiConsumers: defineRoute({
    method: "get",
    url: `/admin/api-consumers`,
    ...withAuthorizationHeaders,
    responses: {
      200: z.array(apiConsumerSchema),
      401: legacyUnauthenticatedErrorSchema,
    },
  }),
});
