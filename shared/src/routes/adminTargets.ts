import { UserAndPassword, WithAuthorization } from "../admin/admin.dto";
import { AgencyId } from "../agency/agency.dto";
import { adminLogin } from "./routes";
import type { Target, CreateTargets, Url } from "http-client";
import { createTargets } from "http-client";
import { FormEstablishmentBatchDto } from "../formEstablishment/FormEstablishment.dto";

type AuthorizedTarget<
  Body = void,
  QueryParams = void,
  UrlWithParams = Url,
> = Target<Body, QueryParams, WithAuthorization, UrlWithParams>;

const dashboardByNameUrl = "/admin/dashboard/:dashboardName";
const addFormEstablishmentBatchUrl = "/admin/add-form-establishment-batch";

export type AdminTargets = CreateTargets<{
  login: Target<UserAndPassword>;
  getDashboardUrl: AuthorizedTarget<
    void,
    { agencyId?: AgencyId },
    typeof dashboardByNameUrl
  >;
  addFormEstablishmentBatch: Target<
    FormEstablishmentBatchDto,
    void,
    WithAuthorization,
    typeof addFormEstablishmentBatchUrl
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
    url: addFormEstablishmentBatchUrl,
  },
});
