import { frontRoutes } from "src/shared/routes";
import { createRouter, defineRoute, param } from "type-route";

export const { RouteProvider, useRoute, routes } = createRouter({
  home: defineRoute("/"),
  todos: defineRoute("/todos"),
  immersionApplication: defineRoute(
    { jwt: param.query.optional.string },
    () => "/demande-immersion",
  ),
  admin: defineRoute("/admin"),
  agencyAdmin: defineRoute(
    { agencyCode: param.path.string },
    (p) => `/agence/${p.agencyCode}`,
  ),
  adminVerification: defineRoute(
    { demandeId: param.path.string },
    (p) => `/admin-verification/${p.demandeId}`,
  ),
  immersionApplicationsToValidate: defineRoute(
    { jwt: param.query.string },
    () => `/${frontRoutes.immersionApplicationsToValidate}`,
  ),
  formEstablishment: defineRoute([
    "/etablissement",
    "/immersion-offer" /* old name, still redirected*/,
  ]),

  debugPopulateDB: defineRoute(
    { count: param.path.number },
    (p) => `/debug/populate/${p.count}`,
  ),
  searchDebug: defineRoute("/debug/search"),
});
