import { UserAndPassword, WithAuthorization } from "../admin/admin.dto";
import { AgencyId } from "../agency/agency.dto";
import { adminLogin } from "./routes";
import type { Target, CreateTargets, Url } from "http-client";
import { createTargets } from "http-client";
import { FormEstablishmentBatch } from "../formEstablishment/FormEstablishment.dto";

type AuthorizedTarget<
  Body = void,
  QueryParams = void,
  UrlWithParams = Url,
> = Target<Body, QueryParams, WithAuthorization, UrlWithParams>;

const dashboardByNameUrl = "/admin/dashboard/:dashboardName";
const formEstablishmentByBatchUrl = "/admin/add-form-establishment-batch";

export type AdminTargets = CreateTargets<{
  login: Target<UserAndPassword>;
  getDashboardUrl: AuthorizedTarget<
    void,
    { agencyId?: AgencyId },
    typeof dashboardByNameUrl
  >;
  addFormEstablishmentBatch: Target<
    FormEstablishmentBatch,
    void,
    WithAuthorization,
    typeof formEstablishmentByBatchUrl
  >;
}>;

export const adminTargets = createTargets<AdminTargets>({
  login: { method: "POST", url: `/admin/${adminLogin}` },
  getDashboardUrl: {
    method: "GET",
    url: dashboardByNameUrl,
  },
  addFormEstablishmentBatch: {
    method: "POST",
    url: formEstablishmentByBatchUrl,
  },
});
