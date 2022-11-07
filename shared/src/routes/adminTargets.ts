import { UserAndPassword, WithAuthorization } from "../admin/admin.dto";
import { adminLogin, dashboardAgency } from "./routes";
import type { Target, CreateTargets, Url } from "http-client";
import { createTargets } from "http-client";

type AuthorizedTarget<
  Body = void,
  QueryParams = void,
  UrlWithParams = Url,
> = Target<Body, QueryParams, WithAuthorization, UrlWithParams>;

export type AdminTargets = CreateTargets<{
  login: Target<UserAndPassword>;
  metabaseAgency: AuthorizedTarget;
  getDashboardUrl: AuthorizedTarget<
    void,
    void,
    "/admin/dashboard/:dashboardName"
  >;
}>;

export const adminTargets = createTargets<AdminTargets>({
  login: { method: "POST", url: `/admin/${adminLogin}` },
  metabaseAgency: { method: "GET", url: `/admin/${dashboardAgency}` },
  getDashboardUrl: {
    method: "GET",
    url: `/admin/dashboard/:dashboardName`,
  },
});
