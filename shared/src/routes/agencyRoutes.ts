import { defineRoute, defineRoutes } from "shared-routes";
import { userParamsForAgencySchema } from "../admin/admin.schema";
import { z } from "zod";
import { userParamsForAgencySchema } from "../admin/admin.schema";
import {
  agencyIdResponseSchema,
  agencyOptionsSchema,
  agencySchema,
  createAgencySchema,
  listAgencyOptionsRequestSchema,
  updateAgencyStatusParamsWithoutIdSchema,
  withAgencyIdSchema,
  withAgencyStatusSchema,
} from "../agency/agency.schema";
import { agencyPublicDisplaySchema } from "../agency/publicAgency.schema";
import { withAuthorizationHeaders } from "../headers";
import { httpErrorSchema } from "../httpClient/httpErrors.schema";
import { inclusionConnectedUserSchema } from "../inclusionConnectedAllowed/inclusionConnectedAllowed.schema";
import { expressEmptyResponseBody } from "../zodUtils";

export type AgencyRoutes = typeof agencyRoutes;

export const agencyRoutes = defineRoutes({
  addAgency: defineRoute({
    method: "post",
    url: "/agencies",
    requestBodySchema: createAgencySchema,
    responses: {
      200: expressEmptyResponseBody,
      404: httpErrorSchema,
      409: httpErrorSchema,
    },
  }),
  createUserForAgency: defineRoute({
    method: "post",
    url: "/dashboard/agency/users",
    requestBodySchema: userParamsForAgencySchema,
    ...withAuthorizationHeaders,
    responses: {
      200: inclusionConnectedUserSchema,
      400: httpErrorSchema,
      401: httpErrorSchema,
      404: httpErrorSchema,
    },
  }),

  getAgencyById: defineRoute({
    method: "get",
    url: "/agencies/:agencyId",
    ...withAuthorizationHeaders,
    responses: { 200: agencySchema },
  }),
  getAgencyOptionsByFilter: defineRoute({
    method: "get",
    url: "/agencies",
    queryParamsSchema: listAgencyOptionsRequestSchema,
    responses: { 200: agencyOptionsSchema },
  }),
  getAgencyPublicInfoById: defineRoute({
    method: "get",
    url: "/agency-public-info-by-id",
    queryParamsSchema: withAgencyIdSchema,
    responses: { 200: agencyPublicDisplaySchema },
  }),
  getAgencyUsersByAgencyIdForDashboard: defineRoute({
    method: "get",
    url: "/dashboard/agencies/:agencyId/users",
    ...withAuthorizationHeaders,
    responses: { 200: z.array(inclusionConnectedUserSchema) },
  }),
  getImmersionFacileAgencyId: defineRoute({
    method: "get",
    url: "/immersion-facile-agency-id",
    responses: { 200: agencyIdResponseSchema },
  }),
  listAgenciesOptionsWithStatus: defineRoute({
    method: "get",
    url: "/admin/agencies",
    queryParamsSchema: withAgencyStatusSchema,
    ...withAuthorizationHeaders,
    responses: {
      200: agencyOptionsSchema,
      401: httpErrorSchema,
    },
  }),
  updateAgency: defineRoute({
    method: "put",
    url: "/agencies/:agencyId",
    requestBodySchema: agencySchema,
    ...withAuthorizationHeaders,
    responses: {
      200: expressEmptyResponseBody,
      401: httpErrorSchema,
      409: httpErrorSchema,
    },
  }),

  updateAgencyStatus: defineRoute({
    method: "patch",
    url: "/admin/agencies/:agencyId",
    requestBodySchema: updateAgencyStatusParamsWithoutIdSchema,
    ...withAuthorizationHeaders,
    responses: {
      200: expressEmptyResponseBody,
      409: httpErrorSchema,
    },
  }),
  updateUserRoleForAgency: defineRoute({
    method: "patch",
    url: "/dashboard/agency/users",
    requestBodySchema: userParamsForAgencySchema,
    ...withAuthorizationHeaders,
    responses: {
      201: expressEmptyResponseBody,
      400: httpErrorSchema,
      401: httpErrorSchema,
      404: httpErrorSchema,
    },
  }),
  removeUserFromAgency: defineRoute({
    method: "delete",
    url: "/dashboard/agencies/:agencyId/users/:userId",
    ...withAuthorizationHeaders,
    responses: {
      200: expressEmptyResponseBody,
      400: httpErrorSchema,
      401: httpErrorSchema,
      404: httpErrorSchema,
    },
  }),
  updateUserRoleForAgency: defineRoute({
    method: "patch",
    url: "/agencies/:agencyId/users",
    requestBodySchema: userParamsForAgencySchema,
    ...withAuthorizationHeaders,
    responses: {
      200: expressEmptyResponseBody,
      400: httpErrorSchema,
      401: httpErrorSchema,
      404: httpErrorSchema,
    },
  }),
});
