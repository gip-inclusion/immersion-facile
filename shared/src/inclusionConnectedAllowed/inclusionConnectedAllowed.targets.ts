import { createTarget, createTargets } from "http-client";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { agencyIdsSchema } from "../agency/agency.schema";
import { withValidateHeadersAuthorization } from "../headers";
import { inclusionConnectedUserSchema } from "./inclusionConnectedAllowed.schema";

export type InclusionConnectedAllowedTargets =
  typeof inclusionConnectedAllowedTargets;

export const inclusionConnectedAllowedTargets = createTargets({
  getInclusionConnectedUser: createTarget({
    method: "GET",
    url: "/inclusion-connected/user",
    ...withValidateHeadersAuthorization,
    validateResponseBody: inclusionConnectedUserSchema.parse,
  }),
  getAgencyDashboard: createTarget({
    method: "GET",
    url: "/inclusion-connected/agency-dashboard",
    ...withValidateHeadersAuthorization,
    validateResponseBody: absoluteUrlSchema.parse,
  }),
  registerAgenciesToUser: createTarget({
    method: "POST",
    url: "/inclusion-connected/register-agency",
    validateRequestBody: agencyIdsSchema.parse,
    ...withValidateHeadersAuthorization,
  }),
});
