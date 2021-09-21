import { createRouter, defineRoute, param } from "type-route";

export const { RouteProvider, useRoute, routes } = createRouter({
  home: defineRoute("/"),
  todos: defineRoute("/todos"),
  demandeImmersion: defineRoute(
    { demandeId: param.query.optional.string },
    () => "/demande-immersion"
  ),
  boulogneSurMer: defineRoute(
    { demandeId: param.query.optional.string },
    () => "/demande-immersion/boulogne-sur-mer"
  ),
  narbonne: defineRoute(
    { demandeId: param.query.optional.string },
    () => "/demande-immersion/narbonne"
  ),
  admin: defineRoute("/admin"),
  adminVerification: defineRoute(
    { demandeId: param.path.string },
    (p) => `/admin-verification/${p.demandeId}`
  ),
});
