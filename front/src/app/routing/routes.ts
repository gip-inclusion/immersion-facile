import { frontRoutes } from "shared/src/routes";
import { createRouter, defineRoute, param } from "type-route";
import { conventionValuesFromUrl } from "./route-params";

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
  errorRedirect: defineRoute(
    {
      title: param.query.optional.string,
      message: param.query.optional.string,
      kind: param.query.optional.string,
    },
    () => "/error",
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
  convention: defineRoute(
    { jwt: param.query.optional.string, ...conventionValuesFromUrl },
    () => "/demande-immersion",
  ),
  conventionForUkraine: defineRoute(
    {
      ...conventionValuesFromUrl,
    },
    () => `/demande-immersion/lesentreprises-sengagent-ukraine`,
  ),
  conventionToValidate: defineRoute(
    { jwt: param.query.string },
    () => `/${frontRoutes.conventionToValidate}`,
  ),
  conventionToSign: defineRoute(
    { jwt: param.query.string },
    () => `/${frontRoutes.conventionToSign}`,
  ),
  immersionAssessment: defineRoute(
    { jwt: param.query.string },
    () => `/${frontRoutes.immersionAssessment}`,
  ),
  landingEstablishment: defineRoute("/accueil-etablissement"),
  renewConventionMagicLink: defineRoute(
    {
      expiredJwt: param.query.string,
      originalURL: param.query.string,
    },
    () => `/${frontRoutes.magicLinkRenewal}`,
  ),
  searchDebug: defineRoute("/debug/search"),
  search: defineRoute("/recherche"),
});
