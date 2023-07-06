import { createRouter, defineRoute, param } from "type-route";
import { AuthenticatedUserQueryParams, frontRoutes } from "shared";
import { formEstablishmentParamsInUrl } from "src/app/routes/routeParams/formEstablishment";
import { adminTabSerializer } from "./routeParams/adminTabs";
import { conventionValuesFromUrl } from "./routeParams/convention";
import { groupsSerializer } from "./routeParams/establishmentGroups";
import { standardPagesSerializer } from "./routeParams/standardPage";

const createInclusionConnectedParams = <
  T extends Record<keyof AuthenticatedUserQueryParams, unknown>,
>(
  t: T,
) => t;
const inclusionConnectedParams = createInclusionConnectedParams({
  token: param.query.optional.string,
  firstName: param.query.optional.string,
  lastName: param.query.optional.string,
  email: param.query.optional.string,
});

export const { RouteProvider, useRoute, routes } = createRouter({
  addAgency: defineRoute(`/${frontRoutes.addAgency}`),
  adminRoot: defineRoute(`/${frontRoutes.admin}`),
  adminTab: defineRoute(
    { tab: param.path.ofType(adminTabSerializer) },
    ({ tab }) => `/${frontRoutes.admin}/${tab}`,
  ),
  agencyDashboard: defineRoute(
    inclusionConnectedParams,
    () => `/${frontRoutes.agencyDashboard}`,
  ),
  conventionCustomAgency: defineRoute(
    { jwt: param.query.optional.string, ...conventionValuesFromUrl },
    () => `/${frontRoutes.conventionImmersionRoute}-agence-immersion-facilitee`,
  ),
  conventionDocument: defineRoute(
    { jwt: param.query.string },
    () => `/${frontRoutes.conventionDocument}`,
  ),
  conventionImmersion: defineRoute(
    { jwt: param.query.optional.string, ...conventionValuesFromUrl },
    () => `/${frontRoutes.conventionImmersionRoute}`,
  ),
  conventionImmersionForExternals: defineRoute(
    {
      consumer: param.path.string,
      jwt: param.query.optional.string,
      ...conventionValuesFromUrl,
    },
    (params) => `/${frontRoutes.conventionImmersionRoute}/${params.consumer}`,
  ),
  conventionMiniStage: defineRoute(
    { jwt: param.query.optional.string, ...conventionValuesFromUrl },
    () => `/${frontRoutes.conventionMiniStageRoute}`,
  ),
  conventionStatusDashboard: defineRoute(
    { jwt: param.query.string },
    () => `/${frontRoutes.conventionStatusDashboard}`,
  ),
  conventionToSign: defineRoute(
    { jwt: param.query.string },
    () => `/${frontRoutes.conventionToSign}`,
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
    formEstablishmentParamsInUrl,
    () => `/${frontRoutes.establishment}`,
  ),
  formEstablishmentForExternals: defineRoute(
    {
      ...formEstablishmentParamsInUrl,
      consumer: param.path.string,
    },
    (params) => `/etablissement/${params.consumer}`,
  ),
  group: defineRoute(
    { groupName: param.path.ofType(groupsSerializer) },
    (params) => `/${frontRoutes.group}/${params.groupName}`,
  ),
  home: defineRoute("/"),
  homeAgencies: defineRoute(`/${frontRoutes.homeAgencies}`),
  homeCandidates: defineRoute(`/${frontRoutes.homeCandidates}`),
  homeEstablishments: defineRoute([
    `/${frontRoutes.homeEstablishments}`,
    `/${frontRoutes.landingEstablishment}`,
  ]),
  immersionAssessment: defineRoute(
    { jwt: param.query.string },
    () => `/${frontRoutes.immersionAssessment}`,
  ),
  manageConvention: defineRoute(
    { jwt: param.query.string },
    () => `/${frontRoutes.manageConvention}`,
  ),
  manageConventionAdmin: defineRoute(
    { conventionId: param.query.string },
    () => `/${frontRoutes.manageConventionAdmin}`,
  ),
  manageConventionInclusionConnected: defineRoute(
    { conventionId: param.query.string },
    () => `/${frontRoutes.manageConventionInclusionConnected}`,
  ),
  manageEstablishmentAdmin: defineRoute(
    { siret: param.query.string },
    () => `/${frontRoutes.manageEstablishmentAdmin}`,
  ),
  openApiDoc: defineRoute("/doc-api"),
  renewConventionMagicLink: defineRoute(
    { expiredJwt: param.query.string, originalURL: param.query.string },
    () => `/${frontRoutes.magicLinkRenewal}`,
  ),
  search: defineRoute(
    {
      distanceKm: param.query.optional.number,
      latitude: param.query.optional.number,
      longitude: param.query.optional.number,
      place: param.query.optional.string,
      rome: param.query.optional.string,
      romeLabel: param.query.optional.string,
      sortedBy: param.query.optional.string,
      appellationLabel: param.query.optional.string,
      appellationCode: param.query.optional.string,
    },
    () => `/${frontRoutes.search}`,
  ),
  standard: defineRoute(
    { pagePath: param.path.ofType(standardPagesSerializer) },
    (params) => `/${frontRoutes.standard}/${params.pagePath}`,
  ),
  stats: defineRoute("/stats"),
});
