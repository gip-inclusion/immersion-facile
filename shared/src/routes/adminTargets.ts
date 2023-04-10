import { createTargets } from "http-client";
import { createTarget } from "http-client/src/configureHttpClient";
import { userAndPasswordSchema } from "../admin/admin.schema";
import { withAgencyIdSchema } from "../agency/agency.schema";
import { formEstablishmentBatchSchema } from "../formEstablishment/FormEstablishment.schema";
import { adminTokenSchema } from "../tokens/token.schema";
import { adminLogin } from "./routes";
import { withValidateHeadersAuthorization } from "./withAuthorization";

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
  }),
  addFormEstablishmentBatch: createTarget({
    method: "POST",
    url: "/admin/add-form-establishment-batch",
    validateRequestBody: formEstablishmentBatchSchema.parse,
    ...withValidateHeadersAuthorization,
  }),
});
