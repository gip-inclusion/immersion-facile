import { defineRoute, defineRoutes } from "shared-routes";
import {
  agenciesIdAndNameSchema,
  agencyIdResponseSchema,
  agencyPublicDisplaySchema,
  agencySchema,
  createAgencySchema,
  listAgenciesRequestSchema,
  withActiveOrRejectedAgencyStatusSchema,
  withAgencyIdSchema,
  withAgencyStatusSchema,
} from "../agency/agency.schema";
import { withAuthorizationHeaders } from "../headers";
import { legacyUnauthenticatedErrorSchema } from "../httpClient/errors/httpErrors.schema";
import { emptyStringSchema } from "../zodUtils";

const agencyWithIdForAdminUrl = `/admin/agencies/:agencyId` as const;

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
    requestBodySchema: withActiveOrRejectedAgencyStatusSchema,
    ...withAuthorizationHeaders,
    responses: { 200: emptyStringSchema },
  }),
  updateAgency: defineRoute({
    method: "put",
    url: agencyWithIdForAdminUrl,
    requestBodySchema: agencySchema,
    ...withAuthorizationHeaders,
    responses: {
      200: emptyStringSchema,
      401: legacyUnauthenticatedErrorSchema,
    },
  }),
  listAgenciesWithStatus: defineRoute({
    method: "get",
    url: `/admin/agencies`,
    queryParamsSchema: withAgencyStatusSchema,
    ...withAuthorizationHeaders,
    responses: {
      200: agenciesIdAndNameSchema,
      401: legacyUnauthenticatedErrorSchema,
    },
  }),
  getFilteredAgencies: defineRoute({
    method: "get",
    url: `/agencies`,
    queryParamsSchema: listAgenciesRequestSchema,
    responses: { 200: agenciesIdAndNameSchema },
  }),
  addAgency: defineRoute({
    method: "post",
    url: `/agencies`,
    requestBodySchema: createAgencySchema,
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
