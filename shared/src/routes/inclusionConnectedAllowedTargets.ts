import { createTarget, createTargets } from "http-client";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import {registerAgencyToInclusionConnectUserParamsSchema} from "../agency/agency.schema";
import { withValidateHeadersAuthorization } from "./withAuthorization";

export type InclusionConnectedAllowedTargets =
  typeof inclusionConnectedAllowedTargets;
export const inclusionConnectedAllowedTargets = createTargets({
  getAgencyDashboard: createTarget({
    method: "GET",
    url: "/inclusion-connected/agency-dashboard",
    ...withValidateHeadersAuthorization,
    validateResponseBody: absoluteUrlSchema.parse,
  }),
  registerAgencyToUser: createTarget({
    method: "POST",
    url: "/inclusion-connected/register-agency",
    ...withValidateHeadersAuthorization,
    validateRequestBody: registerAgencyToInclusionConnectUserParamsSchema.parse,
    validateResponseBody: responseBody => responseBody
  }),
});
