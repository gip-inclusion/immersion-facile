import { frontRoutes } from "src/shared/routes";
import { createRouter, defineRoute, param } from "type-route";
import { immersionApplicationValuesFromUrl } from "./route-params";

export const { RouteProvider, useRoute, routes } = createRouter({
  addAgency: defineRoute("/ajouter-prescripteur"),
  admin: defineRoute("/admin"),
  adminVerification: defineRoute(
    { demandeId: param.path.string },
    (p) => `/admin-verification/${p.demandeId}`,
  ),
  agencyAdmin: defineRoute(
    { agencyId: param.path.string },
    (p) => `/agence/${p.agencyId}`,
  ),
  debugPopulateDB: defineRoute(
    { count: param.path.number },
    (p) => `/debug/populate/${p.count}`,
  ),
  editFormEstablishment: defineRoute(
    { jwt: param.query.string },
    () => `/${frontRoutes.editFormEstablishmentRoute}`,
  ),
  formEstablishment: defineRoute([
    "/etablissement",
    "/immersion-offer" /* old name, still redirected*/,
  ]),
  formEstablishmentForExternals: defineRoute(
    { consumer: param.path.string },
    (p) => `/etablissement/${p.consumer}`,
  ),
  home: defineRoute("/"),
  immersionApplication: defineRoute(
    { jwt: param.query.optional.string, ...immersionApplicationValuesFromUrl },
    () => "/demande-immersion",
  ),
  immersionApplicationForExternals: defineRoute(
    {
      consumer: param.path.string,
      jwt: param.query.optional.string,
      ...immersionApplicationValuesFromUrl,
    },
    (p) => `/demande-immersion/${p.consumer}`,
  ),
  immersionApplicationsToValidate: defineRoute(
    { jwt: param.query.string },
    () => `/${frontRoutes.immersionApplicationsToValidate}`,
  ),
  immersionApplicationsToSign: defineRoute(
    { jwt: param.query.string },
    () => `/${frontRoutes.immersionApplicationsToSign}`,
  ),
  landingEstablishment: defineRoute("/accueil-etablissement"),
  renewMagicLink: defineRoute(
    {
      expiredJwt: param.query.string,
      originalURL: param.query.string,
    },
    () => `/${frontRoutes.magicLinkRenewal}`,
  ),
  searchDebug: defineRoute("/debug/search"),
  search: defineRoute("/recherche"),
});
