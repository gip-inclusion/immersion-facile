import { createTarget, createTargets } from "http-client";
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
import { withValidateHeadersAuthorization } from "../headers";
import { agenciesRoute } from "./routes";

const agencyWithIdForAdminUrl = `/admin/${agenciesRoute}/:agencyId` as const;

export type AgencyTargets = typeof agencyTargets;
export const agencyTargets = createTargets({
  getAgencyAdminById: createTarget({
    method: "GET",
    url: agencyWithIdForAdminUrl,
    ...withValidateHeadersAuthorization,
    validateResponseBody: agencySchema.parse,
  }),
  updateAgencyStatus: createTarget({
    method: "PATCH",
    url: agencyWithIdForAdminUrl,
    validateRequestBody: withActiveOrRejectedAgencyStatusSchema.parse,
    ...withValidateHeadersAuthorization,
  }),
  updateAgency: createTarget({
    method: "PUT",
    url: agencyWithIdForAdminUrl,
    validateRequestBody: agencySchema.parse,
    ...withValidateHeadersAuthorization,
  }),
  getImmersionFacileAgencyId: createTarget({
    method: "GET",
    url: "/immersion-facile-agency-id",
    validateResponseBody: agencyIdResponseSchema.parse,
  }),
  addAgency: createTarget({
    method: "POST",
    url: `/${agenciesRoute}`,
    validateRequestBody: createAgencySchema.parse,
  }),
  getAgencyPublicInfoById: createTarget({
    method: "GET",
    url: "/agency-public-info-by-id",
    validateQueryParams: withAgencyIdSchema.parse,
    validateResponseBody: agencyPublicDisplaySchema.parse,
  }),
  listAgenciesWithStatus: createTarget({
    method: "GET",
    url: `/admin/${agenciesRoute}`,
    validateQueryParams: withAgencyStatusSchema.parse,
    ...withValidateHeadersAuthorization,
    validateResponseBody: agenciesIdAndNameSchema.parse,
  }),
  getFilteredAgencies: createTarget({
    method: "GET",
    url: `/${agenciesRoute}`,
    validateQueryParams: listAgenciesRequestSchema.parse,
    validateResponseBody: agenciesIdAndNameSchema.parse,
  }),
});
