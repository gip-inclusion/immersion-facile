import { UserAndPassword, WithAuthorization } from "../admin/admin.dto";
import { AgencyId } from "../agency/agency.dto";
import { adminLogin } from "./routes";
import type { Target, CreateTargets, Url } from "http-client";
import { createTargets } from "http-client";

type AuthorizedTarget<
  Body = void,
  QueryParams = void,
  UrlWithParams = Url,
> = Target<Body, QueryParams, WithAuthorization, UrlWithParams>;

const dashboardByNameUrl = "/admin/dashboard/:dashboardName";

export type AdminTargets = CreateTargets<{
  login: Target<UserAndPassword>;
  getDashboardUrl: AuthorizedTarget<
    void,
    { agencyId?: AgencyId },
    typeof dashboardByNameUrl
  >;
}>;

export const adminTargets = createTargets<AdminTargets>({
  login: { method: "POST", url: `/admin/${adminLogin}` },
  getDashboardUrl: {
    method: "GET",
    url: dashboardByNameUrl,
  },
});
