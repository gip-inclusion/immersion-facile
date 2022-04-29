import { frontRoutes } from "src/shared/routes";
import { createRouter, defineRoute, param } from "type-route";
import { immersionApplicationValuesFromUrl } from "./route-params";

export const { RouteProvider, useRoute, routes } = createRouter({
  addAgency: defineRoute("/ajouter-prescripteur"),
  admin: defineRoute("/admin"),
  adminVerification: defineRoute(
    { demandeId: param.path.string },
    (params) => `/admin-verification/${params.demandeId}`,
  ),
  agencyAdmin: defineRoute(
    { agencyId: param.path.string },
    (params) => `/agence/${params.agencyId}`,
  ),
  debugPopulateDB: defineRoute(
    { count: param.path.number },
    (params) => `/debug/populate/${params.count}`,
  ),
  editFormEstablishment: defineRoute(
    { jwt: param.query.string },
    () => `/${frontRoutes.editFormEstablishmentRoute}`,
  ),
  formEstablishment: defineRoute(
    { siret: param.query.optional.string },
    () => "/etablissement",
  ),
  formEstablishmentForExternals: defineRoute(
    { consumer: param.path.string },
    (params) => `/etablissement/${params.consumer}`,
  ),
  home: defineRoute("/"),
  immersionApplication: defineRoute(
    { jwt: param.query.optional.string, ...immersionApplicationValuesFromUrl },
    () => "/demande-immersion",
  ),
  immersionApplicationForUkraine: defineRoute(
    {
      ...immersionApplicationValuesFromUrl,
    },
    () => `/demande-immersion/lesentreprises-sengagent-ukraine`,
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
