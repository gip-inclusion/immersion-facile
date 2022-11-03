import { frontRoutes } from "shared";
import { createRouter, defineRoute, param } from "type-route";
import { adminTabSerializer, conventionValuesFromUrl } from "./route-params";

export const { RouteProvider, useRoute, routes } = createRouter({
  addAgency: defineRoute(`/${frontRoutes.addAgency}`),
  adminTab: defineRoute(
    { tab: param.path.ofType(adminTabSerializer) },
    ({ tab }) => `/${frontRoutes.admin}/${tab}`,
  ),
  adminRoot: defineRoute(`/${frontRoutes.admin}`),
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
  homeCandidates: defineRoute(`/${frontRoutes.homeCandidates}`),
  homeEstablishments: defineRoute(`/${frontRoutes.homeEstablishments}`),
  homeAgencies: defineRoute(`/${frontRoutes.homeAgencies}`),
  conventionImmersion: defineRoute(
    { jwt: param.query.optional.string, ...conventionValuesFromUrl },
    () => `/${frontRoutes.conventionImmersionRoute}`,
  ),
  conventionMiniStage: defineRoute(
    { jwt: param.query.optional.string, ...conventionValuesFromUrl },
    () => `/${frontRoutes.conventionMiniStageRoute}`,
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
  stats: defineRoute("/stats"),
});
