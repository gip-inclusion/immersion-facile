import { createTarget, createTargets } from "http-client";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { userAndPasswordSchema } from "../admin/admin.schema";
import { withAgencyIdSchema } from "../agency/agency.schema";
import { EstablishmentBatchReport } from "../formEstablishment/FormEstablishment.dto";
import { formEstablishmentBatchSchema } from "../formEstablishment/FormEstablishment.schema";
import { withValidateHeadersAuthorization } from "../headers";
import { adminTokenSchema } from "../tokens/token.schema";
import { adminLogin } from "./routes";

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
    validateResponseBody: (responseBody) =>
      responseBody as EstablishmentBatchReport, // TODO add validation schema,
  }),
});
