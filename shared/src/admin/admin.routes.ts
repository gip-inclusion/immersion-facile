import { z } from "zod";
import { defineRoute, defineRoutes } from "shared-routes";
import { withAgencyIdSchema } from "../agency/agency.schema";
import {
  apiConsumerJwtSchema,
  apiConsumerSchema,
  createApiConsumerSchema,
} from "../apiConsumer/apiConsumer.schema";
import { dashboardUrlAndNameSchema } from "../dashboard/dashboard.schema";
import { setFeatureFlagSchema } from "../featureFlag/featureFlags.schema";
import {
  establishmentBatchReportSchema,
  formEstablishmentBatchSchema,
} from "../formEstablishment/FormEstablishment.schema";
import { withAuthorizationHeaders } from "../headers";
import {
  httpErrorSchema,
  legacyHttpErrorSchema,
  legacyUnauthenticatedErrorSchema,
} from "../httpClient/httpErrors.schema";
import { inclusionConnectedUserSchema } from "../inclusionConnectedAllowed/inclusionConnectedAllowed.schema";
import { notificationsByKindSchema } from "../notifications/notifications.schema";
import { backOfficeJwtSchema } from "../tokens/jwtPayload.schema";
import { expressEmptyResponseBody } from "../zodUtils";
import {
  icUserRoleForAgencyParamsSchema,
  rejectIcUserRoleForAgencyParamsSchema,
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
      403: legacyHttpErrorSchema,
    },
  }),
  getDashboardUrl: defineRoute({
    method: "get",
    url: "/admin/dashboard/:dashboardName",
    queryParamsSchema: withAgencyIdSchema.partial(),
    ...withAuthorizationHeaders,
    responses: {
      200: dashboardUrlAndNameSchema,
      400: legacyHttpErrorSchema,
      401: legacyUnauthenticatedErrorSchema,
    },
  }),
  addFormEstablishmentBatch: defineRoute({
    method: "post",
    url: "/admin/add-form-establishment-batch",
    requestBodySchema: formEstablishmentBatchSchema,
    ...withAuthorizationHeaders,
    responses: {
      200: establishmentBatchReportSchema,
      400: httpErrorSchema,
      401: legacyUnauthenticatedErrorSchema,
    },
  }),
  updateUserRoleForAgency: defineRoute({
    method: "patch",
    url: "/admin/inclusion-connected/users",
    requestBodySchema: icUserRoleForAgencyParamsSchema,
    ...withAuthorizationHeaders,
    responses: {
      201: expressEmptyResponseBody,
      401: legacyUnauthenticatedErrorSchema,
      404: legacyHttpErrorSchema,
    },
  }),
  rejectIcUserForAgency: defineRoute({
    method: "delete",
    url: "/admin/inclusion-connected/users",
    requestBodySchema: rejectIcUserRoleForAgencyParamsSchema,
    ...withAuthorizationHeaders,
    responses: {
      201: expressEmptyResponseBody,
      401: legacyUnauthenticatedErrorSchema,
      404: legacyHttpErrorSchema,
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
    responses: { 200: notificationsByKindSchema, 400: httpErrorSchema },
  }),
  updateFeatureFlags: defineRoute({
    method: "post",
    url: `/admin/feature-flags`,
    ...withAuthorizationHeaders,
    requestBodySchema: setFeatureFlagSchema,
    responses: {
      201: expressEmptyResponseBody,
      401: legacyUnauthenticatedErrorSchema,
    },
  }),
  saveApiConsumer: defineRoute({
    method: "post",
    url: `/admin/api-consumers`,
    requestBodySchema: createApiConsumerSchema,
    ...withAuthorizationHeaders,
    responses: {
      200: apiConsumerJwtSchema.or(expressEmptyResponseBody),
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
