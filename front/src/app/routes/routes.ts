import { AuthenticatedUserQueryParams, ValueOf, frontRoutes } from "shared";
import { icUserAgencyDashboardTabSerializer } from "src/app/routes/routeParams/agencyDashboardTabs";
import { icUserEstablishmentDashboardTabSerializer } from "src/app/routes/routeParams/establishmentDashboardTabs";
import { ValueSerializer, createRouter, defineRoute, param } from "type-route";
import { adminTabSerializer } from "./routeParams/adminTabs";
import {
  appellationAndRomeDtoArraySerializer,
  appellationStringSerializer,
  conventionValuesFromUrl,
} from "./routeParams/convention";
import { formEstablishmentParamsInUrl } from "./routeParams/formEstablishment";
import { standardPagesSerializer } from "./routeParams/standardPage";

const createInclusionConnectedParams = <
  T extends Record<keyof AuthenticatedUserQueryParams, unknown>,
>(
  t: T,
) => t;

export type AcquisitionParams = Partial<{
  [K in AcquisitionParamsKeys]: (typeof acquisitionParams)[K]["~internal"]["valueSerializer"] extends ValueSerializer<
    infer T
  >
    ? T
    : never;
}>;

type AcquisitionParamsKeys = keyof typeof acquisitionParams;

const inclusionConnectedParams = createInclusionConnectedParams({
  page: param.query.optional.string,
  token: param.query.optional.string,
  firstName: param.query.optional.string,
  lastName: param.query.optional.string,
  email: param.query.optional.string,
});

export const acquisitionParams = {
  mtm_campaign: param.query.optional.string,
  mtm_kwd: param.query.optional.string,
};

export const conventionParams = {
  ...conventionValuesFromUrl,
  discussionId: param.query.optional.string,
  ...acquisitionParams,
};

export const conventionForExternalParams = {
  ...conventionParams,
  consumer: param.path.string,
  jwt: param.query.optional.string,
};

export const establishmentParams = {
  ...formEstablishmentParamsInUrl,
  ...acquisitionParams,
};

export const searchParams = {
  distanceKm: param.query.optional.number,
  latitude: param.query.optional.number,
  longitude: param.query.optional.number,
  appellations: param.query.optional.ofType(
    appellationAndRomeDtoArraySerializer,
  ),
  sortedBy: param.query.optional.string,
  place: param.query.optional.string,
  ...acquisitionParams,
};

export type FrontRouteUnion = ValueOf<typeof routes>;

export const { RouteProvider, useRoute, routes } = createRouter({
  addAgency: defineRoute(`/${frontRoutes.addAgency}`),
  adminRoot: defineRoute(`/${frontRoutes.admin}`),
  admin: defineRoute(
    {
      ...inclusionConnectedParams,
      tab: param.path.optional
        .ofType(adminTabSerializer)
        .default("conventions"),
    },
    ({ tab }) => `/${frontRoutes.admin}/${tab}`,
  ),
  agencyDashboard: defineRoute(
    {
      ...inclusionConnectedParams,
      tab: param.path.optional
        .ofType(icUserAgencyDashboardTabSerializer)
        .default("dashboard"),
    },
    ({ tab }) => [
      `/${frontRoutes.agencyDashboard}/${tab}`,
      `/agence-dashboard/${tab}`, //legacy route redirect to frontRoutes.agencyDashboard
    ],
  ),
  beneficiaryDashboard: defineRoute(`/${frontRoutes.beneficiaryDashboard}`),
  conventionCustomAgency: defineRoute(
    {
      jwt: param.query.optional.string,
      ...conventionParams,
    },
    () => `/${frontRoutes.conventionImmersionRoute}-agence-immersion-facilitee`,
  ),
  conventionConfirmation: defineRoute(
    {
      conventionId: param.path.string,
    },
    ({ conventionId }) =>
      `/${frontRoutes.conventionImmersionRoute}/confirmation/${conventionId}`,
  ),
  conventionDocument: defineRoute(
    {
      jwt: param.query.optional.string,
      conventionId: param.query.optional.string,
    },
    () => `/${frontRoutes.conventionDocument}`,
  ),
  initiateConvention: defineRoute(
    {
      ...acquisitionParams,
      skipFirstStep: param.query.optional.boolean,
    },
    () => `/${frontRoutes.initiateConvention}`,
  ),
  conventionImmersion: defineRoute(
    {
      jwt: param.query.optional.string,
      ...conventionParams,
    },
    () => `/${frontRoutes.conventionImmersionRoute}`,
  ),
  conventionImmersionForExternals: defineRoute(
    conventionForExternalParams,
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
  //TODO: Why this route still exist?
  debugPopulateDB: defineRoute(
    { count: param.path.number },
    (params) => `/debug/populate/${params.count}`,
  ),
  editFormEstablishment: defineRoute(
    { jwt: param.query.string },
    () => `/${frontRoutes.editFormEstablishmentRoute}`,
  ),
  establishmentDashboard: defineRoute(
    {
      ...inclusionConnectedParams,
      tab: param.path.optional
        .ofType(icUserEstablishmentDashboardTabSerializer)
        .default("conventions"),
      siret: param.query.optional.string,
    },
    ({ tab }) => `/${frontRoutes.establishmentDashboard}/${tab}`,
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
    establishmentParams,
    () => `/${frontRoutes.establishment}`,
  ),
  formEstablishmentForExternals: defineRoute(
    {
      ...establishmentParams,
      consumer: param.path.string,
    },
    (params) => `/etablissement/${params.consumer}`,
  ),
  unregisterEstablishmentLead: defineRoute(
    {
      jwt: param.query.string,
    },
    () => `/${frontRoutes.unsubscribeEstablishmentLead}`,
  ),
  group: defineRoute(
    { groupSlug: param.path.string },
    (params) => `/${frontRoutes.group}/${params.groupSlug}`,
  ),
  home: defineRoute("/"),
  homeAgencies: defineRoute(`/${frontRoutes.homeAgencies}`),
  homeCandidates: defineRoute(`/${frontRoutes.homeCandidates}`),
  homeEstablishments: defineRoute([
    `/${frontRoutes.homeEstablishments}`,
    `/${frontRoutes.landingEstablishment}`,
  ]),
  assessment: defineRoute(
    { jwt: param.query.string },
    () => `/${frontRoutes.assessment}`,
  ),
  searchResult: defineRoute(
    {
      appellationCode: param.query.ofType(appellationStringSerializer),
      siret: param.query.string,
      location: param.query.optional.string,
      contactFirstName: param.query.optional.string,
      contactLastName: param.query.optional.string,
      contactEmail: param.query.optional.string,
      contactPhone: param.query.optional.string,
      contactMessage: param.query.optional.string,
    },
    () => `/${frontRoutes.offer}`,
  ),
  searchResultExternal: defineRoute(
    {
      siret: param.query.string,
    },
    () => `/${frontRoutes.offerExternal}`,
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
  manageDiscussion: defineRoute(
    { discussionId: param.query.string },
    () => `/${frontRoutes.manageDiscussion}`,
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
  search: defineRoute(searchParams, () => `/${frontRoutes.search}`),
  searchDiagoriente: defineRoute(
    searchParams,
    () => `/${frontRoutes.searchDiagoriente}`,
  ),
  standard: defineRoute(
    { pagePath: param.path.ofType(standardPagesSerializer) },
    (params) => `/${frontRoutes.standard}/${params.pagePath}`,
  ),
  stats: defineRoute("/stats"),
});
