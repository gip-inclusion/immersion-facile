import { z } from "zod";
import { createTarget, createTargets } from "http-client";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { withAgencyIdSchema } from "../agency/agency.schema";
import {
  establishmentBatchReportSchema,
  formEstablishmentBatchSchema,
} from "../formEstablishment/FormEstablishment.schema";
import { withValidateHeadersAuthorization } from "../headers";
import { inclusionConnectedUserSchema } from "../inclusionConnectedAllowed/inclusionConnectedAllowed.schema";
import { adminLogin } from "../routes/routes";
import { adminTokenSchema } from "../tokens/token.schema";
import {
  registerAgencyWithRoleToUserSchema,
  userAndPasswordSchema,
  withAgencyRoleSchema,
} from "./admin.schema";

export type AdminTargets = typeof adminTargets;
export const adminTargets = createTargets({
  login: createTarget({
    method: "POST",
    url: `/admin/${adminLogin}`,
    validateRequestBody: userAndPasswordSchema.parse,
    validateResponseBody: adminTokenSchema.parse,
  }),
  getDashboardUrl: createTarget({
    method: "GET",
    url: "/admin/dashboard/:dashboardName",
    validateQueryParams: withAgencyIdSchema.partial().parse,
    ...withValidateHeadersAuthorization,
    validateResponseBody: absoluteUrlSchema.parse,
  }),
  addFormEstablishmentBatch: createTarget({
    method: "POST",
    url: "/admin/add-form-establishment-batch",
    validateRequestBody: formEstablishmentBatchSchema.parse,
    ...withValidateHeadersAuthorization,
    validateResponseBody: establishmentBatchReportSchema.parse,
  }),
  updateAgencyRoleForUser: createTarget({
    method: "PATCH",
    url: "/admin/inclusion-connected/users",
    validateRequestBody: registerAgencyWithRoleToUserSchema.parse,
    ...withValidateHeadersAuthorization,
  }),
  getInclusionConnectedUsers: createTarget({
    method: "GET",
    url: "/admin/inclusion-connected/users",
    validateQueryParams: withAgencyRoleSchema.parse,
    ...withValidateHeadersAuthorization,
    validateResponseBody: z.array(inclusionConnectedUserSchema).parse,
  }),
});
