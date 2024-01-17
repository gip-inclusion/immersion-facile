import { defineRoute, defineRoutes } from "shared-routes";
import {
  agenciesIdAndNameSchema,
  agencyIdResponseSchema,
  agencySchema,
  createAgencySchema,
  listAgenciesRequestSchema,
  updateAgencyStatusParamsWithoutIdSchema,
  withAgencyIdSchema,
  withAgencyStatusSchema,
} from "../agency/agency.schema";
import { agencyPublicDisplaySchema } from "../agency/publicAgency.schema";
import { withAuthorizationHeaders } from "../headers";
import {
  legacyHttpErrorSchema,
  legacyUnauthenticatedErrorSchema,
} from "../httpClient/httpErrors.schema";
import { expressEmptyResponseBody } from "../zodUtils";

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
    requestBodySchema: updateAgencyStatusParamsWithoutIdSchema,
    ...withAuthorizationHeaders,
    responses: {
      200: expressEmptyResponseBody,
      409: legacyHttpErrorSchema,
    },
  }),
  updateAgency: defineRoute({
    method: "put",
    url: agencyWithIdForAdminUrl,
    requestBodySchema: agencySchema,
    ...withAuthorizationHeaders,
    responses: {
      200: expressEmptyResponseBody,
      401: legacyUnauthenticatedErrorSchema,
      409: legacyHttpErrorSchema,
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
    responses: {
      200: expressEmptyResponseBody,
      404: legacyHttpErrorSchema,
      409: legacyHttpErrorSchema,
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

export const invalidAgencySiretMessage =
  "Le SIRET que vous avez saisi n'est pas valide et votre organisme n'a pas été enregistré. Merci de corriger le SIRET et de soumettre à nouveau le formulaire.";
