import { frontRoutes } from "src/shared/routes";
import { createRouter, defineRoute, param } from "type-route";

export const { RouteProvider, useRoute, routes } = createRouter({
  home: defineRoute("/"),
  todos: defineRoute("/todos"),
  boulogneSurMer: defineRoute(
    { demandeId: param.query.optional.string },
    () => "/demande-immersion/boulogne-sur-mer",
  ),
  narbonne: defineRoute(
    { demandeId: param.query.optional.string },
    () => "/demande-immersion/narbonne",
  ),
  immersionApplication: defineRoute(
    { jwt: param.query.optional.string },
    () => "/demande-immersion",
  ),
  admin: defineRoute("/admin"),
  adminVerification: defineRoute(
    { demandeId: param.path.string },
    (p) => `/admin-verification/${p.demandeId}`,
  ),
  immersionApplicationsToValidate: defineRoute(
    { jwt: param.query.string },
    () => `/${frontRoutes.immersionApplicationsToValidate}`,
  ),
  immersionOffer: defineRoute("/immersion-offer"),

  debugPopulateDB: defineRoute(
    { count: param.path.number },
    (p) => `/debug/populate/${p.count}`,
  ),
});
