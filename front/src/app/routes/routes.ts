import {
  type AdminTabRouteName,
  type AlreadyAuthenticatedUserQueryParams,
  adminTabRouteNames,
  adminTabs,
  type ConnectedUserQueryParams,
  frontRoutes,
  type ValueOf,
} from "shared";
import {
  createRouter,
  defineRoute,
  param,
  type ValueSerializer,
} from "type-route";
import {
  appellationAndRomeDtoArraySerializer,
  appellationStringSerializer,
  conventionValuesFromUrl,
  nafCodeSerializer,
} from "./routeParams/convention";
import { standardPagesSerializer } from "./routeParams/standardPage";

export type AcquisitionParams = Partial<{
  [K in AcquisitionParamsKeys]: (typeof acquisitionParams)[K]["~internal"]["valueSerializer"] extends ValueSerializer<
    infer T
  >
    ? T
    : never;
}>;

type AcquisitionParamsKeys = keyof typeof acquisitionParams;

const connectedUserParams = {
  token: param.query.optional.string,
  firstName: param.query.optional.string,
  lastName: param.query.optional.string,
  email: param.query.optional.string,
  idToken: param.query.optional.string,
  provider: param.query.optional.string,
  alreadyUsedAuthentication: param.query.optional.string,
} satisfies Record<
  keyof ConnectedUserQueryParams | keyof AlreadyAuthenticatedUserQueryParams,
  typeof param.query.optional.string
>;

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
  fitForDisabledWorkers: param.query.optional.boolean,
  currentPage: param.query.optional.number,
  nafCodes: param.query.optional.ofType(nafCodeSerializer),
  nafLabel: param.query.optional.string,
  ...acquisitionParams,
};

export type FrontRouteUnion = ValueOf<typeof routes>;
export type FrontRouteKeys = keyof typeof routes;

const admin = defineRoute(connectedUserParams, () => `/${frontRoutes.admin}`);

const agencyDashboard = defineRoute(connectedUserParams, () => [
  `/${frontRoutes.agencyDashboard}`,
  "/agence-dashboard", //legacy route redirect to frontRoutes.agencyDashboard
]);

const establishmentDashboard = defineRoute(
  connectedUserParams,
  () => `/${frontRoutes.establishmentDashboard}`,
);

const myProfile = defineRoute(
  connectedUserParams,
  () => `/${frontRoutes.profile}`,
);

const agencyDashboardAgencies = agencyDashboard.extend("/agences");

const { adminConventions, adminAgencies, adminUsers, ...restOfAdminRoutes } =
  adminTabRouteNames.reduce(
    (acc, adminTabName) => ({
      ...acc,
      [adminTabName]: admin.extend(`/${adminTabs[adminTabName].slug}`),
    }),
    {} as Record<AdminTabRouteName, typeof admin>,
  );

export const { RouteProvider, useRoute, routes } = createRouter({
  addAgency: defineRoute(
    { ...connectedUserParams, siret: param.query.optional.string },
    () => `/${frontRoutes.addAgency}`,
  ),

  admin,
  ...restOfAdminRoutes,
  adminConventions,
  adminConventionDetail: adminConventions.extend(
    { conventionId: param.path.string },
    ({ conventionId }) => `/${conventionId}`,
  ),
  adminUsers,
  adminUserDetail: adminUsers.extend(
    { userId: param.path.string },
    ({ userId }) => `/${userId}`,
  ),
  adminAgencies,
  adminAgencyDetail: adminAgencies.extend(
    { agencyId: param.path.string },
    ({ agencyId }) => `/${agencyId}`,
  ),
  agencyDashboard,
  agencyDashboardMain: agencyDashboard.extend("/dashboard"),
  agencyDashboardOnboarding: agencyDashboard.extend("/onboarding"),
  agencyDashboardSynchronisedConventions: agencyDashboard.extend(
    "/conventions-synchronisees",
  ),
  agencyDashboardStatsAgencies: agencyDashboard.extend("/stats-agences"),
  agencyDashboardStatsActivitiesByEstablishment: agencyDashboard.extend(
    "/stats-activites-par-entreprise",
  ),
  myProfile,
  myProfileAgencyRegistration: myProfile.extend("/agency-registration"),
  agencyDashboardAgencies: agencyDashboardAgencies,
  agencyDashboardAgencyDetails: agencyDashboardAgencies.extend(
    { agencyId: param.path.string },
    ({ agencyId }) => `/${agencyId}`,
  ),
  beneficiaryDashboard: defineRoute(`/${frontRoutes.beneficiaryDashboard}`),
  conventionConfirmation: defineRoute(
    {
      conventionId: param.path.string,
    },
    ({ conventionId }) =>
      `/${frontRoutes.conventionImmersionRoute}/confirmation/${conventionId}`,
  ),
  assessmentDocument: defineRoute(
    {
      jwt: param.query.optional.string,
      conventionId: param.query.optional.string,
    },
    () => `/${frontRoutes.assessmentDocument}`,
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
      skipIntro: param.query.optional.boolean,
      conventionId: param.query.optional.string,
      ...conventionParams,
    },
    () => `/${frontRoutes.conventionImmersionRoute}`,
  ),
  conventionImmersionForExternals: defineRoute(
    conventionForExternalParams,
    (params) => `/${frontRoutes.conventionImmersionRoute}/${params.consumer}`,
  ),
  conventionMiniStage: defineRoute(
    {
      jwt: param.query.optional.string,
      conventionId: param.query.optional.string,
      ...conventionValuesFromUrl,
    },
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
  establishmentDashboard,
  establishmentDashboardConventions:
    establishmentDashboard.extend("/conventions"),
  establishmentDashboardFormEstablishment: establishmentDashboard.extend(
    {
      siret: param.query.optional.string,
      shouldUpdateAvailability: param.query.optional.string,
    },
    () => "/fiche-entreprise",
  ),
  establishmentDashboardDiscussions: establishmentDashboard.extend(
    {
      discussionId: param.path.optional.string,
    },
    ({ discussionId }) => `/discussions/${discussionId}`,
  ),
  formEstablishment: defineRoute(
    {
      ...connectedUserParams,
      ...establishmentParams,
    },
    () => `/${frontRoutes.establishment}`,
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
    {
      jwt: param.query.string,
      conventionId: param.query.optional.string,
    },
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
    () => `/${frontRoutes.searchResult}`,
  ),
  searchResultForStudent: defineRoute(
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
    () => `/${frontRoutes.searchResultForStudent}`,
  ),
  searchResultExternal: defineRoute(
    {
      siret: param.query.string,
      appellationCode: param.query.ofType(appellationStringSerializer),
    },
    () => `/${frontRoutes.searchResultExternal}`,
  ),
  manageConvention: defineRoute(
    { jwt: param.query.string },
    () => `/${frontRoutes.manageConvention}`,
  ),
  manageConventionConnectedUser: defineRoute(
    { conventionId: param.query.string },
    () => `/${frontRoutes.manageConventionUserConnected}`,
  ),
  manageEstablishmentAdmin: defineRoute(
    { siret: param.query.string },
    () => `/${frontRoutes.manageEstablishmentAdmin}`,
  ),
  openApiDoc: defineRoute("/doc-api"),
  renewConventionMagicLink: defineRoute(
    { expiredJwt: param.query.string, originalUrl: param.query.string },
    () => `/${frontRoutes.magicLinkRenewal}`,
  ),
  search: defineRoute(searchParams, () => `/${frontRoutes.search}`),
  searchForStudent: defineRoute(
    searchParams,
    () => `/${frontRoutes.searchForStudent}`,
  ),
  standard: defineRoute(
    {
      pagePath: param.path.ofType(standardPagesSerializer),
      version: param.query.optional.string,
    },
    (params) => `/${frontRoutes.standard}/${params.pagePath}`,
  ),
  stats: defineRoute("/stats"),
});
