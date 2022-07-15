import { frontRoutes } from "shared/src/routes";
import { createRouter, defineRoute, param } from "type-route";
import { conventionValuesFromUrl } from "./route-params";

export const { RouteProvider, useRoute, routes } = createRouter({
  addAgency: defineRoute(`/${frontRoutes.addAgency}`),
  admin: defineRoute(`/${frontRoutes.admin}`),
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
    () => `/${frontRoutes.error}`,
  ),
  formEstablishment: defineRoute(
    { siret: param.query.optional.string },
    () => `/${frontRoutes.establishment}`,
  ),
  formEstablishmentForExternals: defineRoute(
    { consumer: param.path.string },
    (params) => `/etablissement/${params.consumer}`,
  ),
  home: defineRoute("/"),
  convention: defineRoute(
    { jwt: param.query.optional.string, ...conventionValuesFromUrl },
    () => `/${frontRoutes.conventionRoute}`,
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
  landingEstablishment: defineRoute(`/${frontRoutes.landingEstablishment}`),
  renewConventionMagicLink: defineRoute(
    {
      expiredJwt: param.query.string,
      originalURL: param.query.string,
    },
    () => `/${frontRoutes.magicLinkRenewal}`,
  ),
  searchDebug: defineRoute("/debug/search"),
  search: defineRoute(`/${frontRoutes.search}`),
});
