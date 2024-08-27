import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import { withAgencyIdSchema } from "../agency/agency.schema";
import {
  apiConsumerJwtSchema,
  apiConsumerSchema,
  writeApiConsumerSchema,
} from "../apiConsumer/apiConsumer.schema";
import { dashboardUrlAndNameSchema } from "../dashboard/dashboard.schema";
import { setFeatureFlagSchema } from "../featureFlag/featureFlags.schema";
import {
  establishmentBatchReportSchema,
  formEstablishmentBatchSchema,
} from "../formEstablishment/FormEstablishment.schema";
import { withAuthorizationHeaders } from "../headers";
import { httpErrorSchema } from "../httpClient/httpErrors.schema";
import { inclusionConnectedUserSchema } from "../inclusionConnectedAllowed/inclusionConnectedAllowed.schema";
import { notificationsByKindSchema } from "../notifications/notifications.schema";
import { expressEmptyResponseBody } from "../zodUtils";
import {
  rejectIcUserRoleForAgencyParamsSchema,
  userUpdateParamsForAgencySchema,
  withUserFiltersSchema,
} from "./admin.schema";

export type AdminRoutes = typeof adminRoutes;
export const adminRoutes = defineRoutes({
  getDashboardUrl: defineRoute({
    method: "get",
    url: "/admin/dashboard/:dashboardName",
    queryParamsSchema: withAgencyIdSchema.partial(),
    ...withAuthorizationHeaders,
    responses: {
      200: dashboardUrlAndNameSchema,
      400: httpErrorSchema,
      401: httpErrorSchema,
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
      401: httpErrorSchema,
    },
  }),
  updateUserRoleForAgency: defineRoute({
    method: "patch",
    url: "/admin/inclusion-connected/users",
    requestBodySchema: userUpdateParamsForAgencySchema,
    ...withAuthorizationHeaders,
    responses: {
      201: expressEmptyResponseBody,
      400: httpErrorSchema,
      401: httpErrorSchema,
      404: httpErrorSchema,
    },
  }),
  rejectIcUserForAgency: defineRoute({
    method: "delete",
    url: "/admin/inclusion-connected/users",
    requestBodySchema: rejectIcUserRoleForAgencyParamsSchema,
    ...withAuthorizationHeaders,
    responses: {
      201: expressEmptyResponseBody,
      401: httpErrorSchema,
      404: httpErrorSchema,
    },
  }),
  getInclusionConnectedUsers: defineRoute({
    method: "get",
    url: "/admin/inclusion-connected/users",
    queryParamsSchema: withUserFiltersSchema,
    ...withAuthorizationHeaders,
    responses: {
      200: z.array(inclusionConnectedUserSchema),
      401: httpErrorSchema,
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
    url: "/admin/feature-flags",
    ...withAuthorizationHeaders,
    requestBodySchema: setFeatureFlagSchema,
    responses: {
      201: expressEmptyResponseBody,
      401: httpErrorSchema,
    },
  }),
  saveApiConsumer: defineRoute({
    method: "post",
    url: "/admin/api-consumers",
    requestBodySchema: writeApiConsumerSchema,
    ...withAuthorizationHeaders,
    responses: {
      200: apiConsumerJwtSchema.or(expressEmptyResponseBody),
      401: httpErrorSchema,
    },
  }),
  getAllApiConsumers: defineRoute({
    method: "get",
    url: "/admin/api-consumers",
    ...withAuthorizationHeaders,
    responses: {
      200: z.array(apiConsumerSchema),
      401: httpErrorSchema,
    },
  }),
});
