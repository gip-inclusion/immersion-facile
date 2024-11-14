import { defineRoute, defineRoutes } from "shared-routes";
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
import { expressEmptyResponseBody } from "../zodUtils";

const agencyWithIdForAdminUrl = "/admin/agencies/:agencyId" as const;

export type AgencyRoutes = typeof agencyRoutes;
export const agencyRoutes = defineRoutes({
  getAgencyAdminById: defineRoute({
    method: "get",
    url: agencyWithIdForAdminUrl,
    ...withAuthorizationHeaders,
    responses: { 200: agencySchema },
  }),
  updateAgencyStatus: defineRoute({
    method: "patch",
    url: agencyWithIdForAdminUrl,
    requestBodySchema: updateAgencyStatusParamsWithoutIdSchema,
    ...withAuthorizationHeaders,
    responses: {
      200: expressEmptyResponseBody,
      409: httpErrorSchema,
    },
  }),
  updateAgency: defineRoute({
    method: "put",
    url: agencyWithIdForAdminUrl,
    requestBodySchema: agencySchema,
    ...withAuthorizationHeaders,
    responses: {
      200: expressEmptyResponseBody,
      401: httpErrorSchema,
      409: httpErrorSchema,
    },
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
  getAgencyOptionsByFilter: defineRoute({
    method: "get",
    url: "/agencies",
    queryParamsSchema: listAgencyOptionsRequestSchema,
    responses: { 200: agencyOptionsSchema },
  }),
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
  getImmersionFacileAgencyId: defineRoute({
    method: "get",
    url: "/immersion-facile-agency-id",
    responses: { 200: agencyIdResponseSchema },
  }),
  getAgencyPublicInfoById: defineRoute({
    method: "get",
    url: "/agency-public-info-by-id",
    queryParamsSchema: withAgencyIdSchema,
    responses: { 200: agencyPublicDisplaySchema },
  }),
});
