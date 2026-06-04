import {
  createRouter,
  defineRoute,
  param,
  type Route,
  type ValueSerializer,
} from "type-route";
import type {
  AbsoluteUrl,
  AllowedLoginSource,
  AlreadyAuthenticatedUserQueryParams,
  ConnectedUserQueryParams,
} from "..";
import {
  type AdminTabRouteName,
  adminTabRouteNames,
  adminTabs,
} from "../admin/adminTabs";
import type { ValueOf } from "../utils";
import { standardPagesSerializer } from "./routeParams/standardPage";
import {
  appellationAndRomeDtoArraySerializer,
  appellationAndRomeDtoSerializer,
  appellationStringSerializer,
  nafCodeSerializer,
  remoteWorkModeSerializer,
} from "./valueSerializer";

const allowedLoginSourcesRoutes: Record<AllowedLoginSource, string> = {
  admin: "admin",
  formEstablishment: "establishment",
  establishmentDashboard: "tableau-de-bord-etablissement",
  establishmentDashboardDiscussions:
    "tableau-de-bord-etablissement/discussions",
  agencyDashboard: "tableau-de-bord-agence",
  addAgency: "ajouter-prescripteur",
  manageConventionConnectedUser: "pilotage-convention-inclusion-connect",
  conventionTemplate: "modele-convention",
  myProfile: "mon-profil",
  beneficiaryDashboard: "tableau-de-bord-beneficiaire",
  beneficiaryDashboardDiscussions: "tableau-de-bord-beneficiaire/discussions",
};

export const frontRoutes = {
  ...allowedLoginSourcesRoutes,
  assessmentDocument: "bilan-document",
  beneficiaryDashboard: "tableau-de-bord-beneficiaire",
  initiateConvention: "initier-convention",
  conventionImmersion: "demande-immersion",
  conventionDocument: "convention-immersion",
  conventionMiniStageRoute: "demande-mini-stage",
  conventionStatusDashboard: "statut-convention",
  conventionToSign: "verifier-et-signer",
  error: "error",
  group: "groupe",
  homeAgencies: "accueil-prescripteurs",
  homeCandidates: "accueil-beneficiaires",
  homeEstablishments: "accueil-entreprises",
  assessment: "bilan-immersion",
  searchResult: "offre",
  searchResultForStudent: "offre-scolaire",
  searchResultExternal: "tentez-votre-chance",
  landingEstablishment: "accueil-etablissement",
  magicLinkInterstitial: "connexion-interstitiel",
  manageConvention: "pilotage-convention",
  manageEstablishmentAdmin: "pilotage-etablissement-admin",
  myProfileEstablishmentRegistration: "rattachement-entreprise",
  profile: "mon-profil",
  search: "recherche",
  externalSearch: "recherche-partenaires",
  searchForStudent: "recherche-scolaire",
  searchDiagoriente: "recherche-diagoriente",
  standard: "pages",
  unsubscribeEstablishmentLead: "desinscription-prospect",
};

export const loginFtConnect = "login-pe-connect";
export const ftConnect = "pe-connect";

export const uploadFileRoute = "upload-file";

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

export const ftConnectParams = {
  fedId: param.query.optional.string,
  fedIdProvider: param.query.optional.string,
  fedIdToken: param.query.optional.string,

  // TODO temporary FT Connect params (to remove after FT Connect login refacto to save nounce and state)
  birthdate: param.query.optional.string,
  firstName: param.query.optional.string,
  lastName: param.query.optional.string,
  email: param.query.optional.string,
  phone: param.query.optional.string,
};

const agencyParamsForConventionForm = {
  agencyDepartment: param.query.optional.string,
  agencyKind: param.query.optional.string,
  agencyId: param.query.optional.string,
};

const establishmentParamsForConventionForm = {
  siret: param.query.optional.string,
  immersionAddress: param.query.optional.string,
  immersionAppellation: param.query.optional.ofType(
    appellationAndRomeDtoSerializer,
  ),
};

export const conventionForExternalParams = {
  consumer: param.path.string,
  jwt: param.query.optional.string,
};

export const establishmentParams = {
  ...acquisitionParams,
  fromConventionId: param.query.optional.string,
};

export const searchParams = {
  distanceKm: param.query.optional.number,
  latitude: param.query.optional.number,
  longitude: param.query.optional.number,
  appellations: param.query.optional.ofType(
    appellationAndRomeDtoArraySerializer,
  ),
  appellationCodes: param.query.optional.ofType(appellationStringSerializer),
  sortBy: param.query.optional.string,
  sortOrder: param.query.optional.string,
  place: param.query.optional.string,
  fitForDisabledWorkers: param.query.optional.boolean,
  page: param.query.optional.number,
  perPage: param.query.optional.number,
  nafCodes: param.query.optional.ofType(nafCodeSerializer),
  nafLabel: param.query.optional.string,
  remoteWorkModes: param.query.optional.ofType(remoteWorkModeSerializer),
  showOnlyAvailableOffers: param.query.optional.boolean,
  ...acquisitionParams,
};

export type FrontRouteUnion = ValueOf<typeof routes>;
export type FrontRouteKeys = keyof typeof routes;

export type ConventionTemplateFromRoute = Extract<
  FrontRouteKeys,
  "agencyDashboard" | "establishmentDashboard"
>;

const admin = defineRoute(connectedUserParams, () => `/${frontRoutes.admin}`);

const beneficiaryDashboard = defineRoute(
  {
    ...connectedUserParams,
    ...acquisitionParams,
  },
  () => `/${frontRoutes.beneficiaryDashboard}`,
);

const agencyDashboard = defineRoute(
  {
    ...connectedUserParams,
    isAgencyRegistration: param.query.optional.boolean,
  },
  () => [
    `/${frontRoutes.agencyDashboard}`,
    "/agence-dashboard", //legacy route redirect to frontRoutes.agencyDashboard
  ],
);

const establishmentDashboard = defineRoute(
  {
    ...connectedUserParams,
    ...acquisitionParams,
  },
  () => `/${frontRoutes.establishmentDashboard}`,
);

const myProfile = defineRoute(
  connectedUserParams,
  () => `/${frontRoutes.profile}`,
);

const agencyDashboardAgencies = agencyDashboard.extend("/agences");

const {
  adminConventions,
  adminAgencies,
  adminUsers,
  adminEstablishments,
  ...restOfAdminRoutes
} = adminTabRouteNames.reduce(
  (acc, adminTabName) => ({
    ...acc,
    [adminTabName]: admin.extend(`/${adminTabs[adminTabName].slug}`),
  }),
  {} as Record<AdminTabRouteName, typeof admin>,
);

const conventionTemplateFromRouteValues = [
  "establishmentDashboard",
  "agencyDashboard",
] as const;

export const isConventionTemplateFromRoute = (
  value: unknown,
): value is ConventionTemplateFromRoute =>
  typeof value === "string" &&
  conventionTemplateFromRouteValues.some((v) => v === value);

export const conventionTemplateFromRouteSerializer: ValueSerializer<
  "agencyDashboard" | "establishmentDashboard"
> = {
  parse: (value) => {
    if (isConventionTemplateFromRoute(value)) return value;
    throw new Error(
      `Invalid convention template fromRoute: expected one of ${conventionTemplateFromRouteValues.join(", ")}, got "${value}"`,
    );
  },
  stringify: (value) => value,
};

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
  adminUserDetailAgencies: adminUsers.extend(
    { userId: param.path.string },
    ({ userId }) => `/${userId}/agences`,
  ),
  adminUserDetailEstablishments: adminUsers.extend(
    { userId: param.path.string },
    ({ userId }) => `/${userId}/etablissements`,
  ),
  adminAgencies,
  adminAgencyDetail: adminAgencies.extend(
    { agencyId: param.path.string },
    ({ agencyId }) => `/${agencyId}`,
  ),
  adminEstablishments: adminEstablishments.extend(
    { siret: param.path.optional.string },
    ({ siret }) => `/${siret}`,
  ),

  agencyDashboard,
  agencyDashboardMain: agencyDashboard.extend("/dashboard"),
  agencyDashboardOnboarding: agencyDashboard.extend("/onboarding"),
  statsEstablishmentDetails: agencyDashboard.extend(
    "/stats-activites-par-entreprise",
  ),
  agencyManagement: agencyDashboard.extend("/pilotage-structure"),
  establishmentManagement: agencyDashboard.extend("/pilotage-entreprises"),

  myProfile,
  myProfileAgencies: myProfile.extend("/mes-agences"),
  myProfileEstablishments: myProfile.extend("/mes-etablissements"),
  myProfileAgencyRegistration: myProfile.extend("/agency-registration"),
  myProfileEstablishmentRegistration: myProfile.extend(
    { siret: param.query.optional.string },
    () => `/${frontRoutes.myProfileEstablishmentRegistration}`,
  ),
  agencyDashboardAgencies: agencyDashboardAgencies,
  agencyDashboardAgencyDetails: agencyDashboardAgencies.extend(
    { agencyId: param.path.string },
    ({ agencyId }) => `/${agencyId}`,
  ),
  beneficiaryDashboard,
  beneficiaryDashboardDiscussions: beneficiaryDashboard.extend(
    {
      discussionId: param.path.optional.string,
    },
    ({ discussionId }) => `/discussions/${discussionId}`,
  ),
  conventionConfirmation: defineRoute(
    {
      conventionId: param.path.string,
    },
    ({ conventionId }) =>
      `/${frontRoutes.conventionImmersion}/confirmation/${conventionId}`,
  ),
  assessmentDocument: defineRoute(
    {
      jwt: param.query.optional.string,
      conventionId: param.query.optional.string,
      ...acquisitionParams,
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
      conventionDraftId: param.query.optional.string,
      conventionTemplateId: param.query.optional.string,
      discussionId: param.query.optional.string,
      ...agencyParamsForConventionForm,
      ...establishmentParamsForConventionForm,
      ...ftConnectParams,
      ...acquisitionParams,
    },
    () => `/${frontRoutes.conventionImmersion}`,
  ),
  conventionImmersionForExternals: defineRoute(
    {
      discussionId: param.query.optional.string,
      ...agencyParamsForConventionForm,
      ...establishmentParamsForConventionForm,
      ...ftConnectParams,
      ...acquisitionParams,
      ...conventionForExternalParams,
    },
    (params) => `/${frontRoutes.conventionImmersion}/${params.consumer}`,
  ),
  conventionMiniStage: defineRoute(
    {
      jwt: param.query.optional.string,
      conventionId: param.query.optional.string,
      conventionDraftId: param.query.optional.string,
      conventionTemplateId: param.query.optional.string,
      ...agencyParamsForConventionForm,
      ...establishmentParamsForConventionForm,
    },
    () => `/${frontRoutes.conventionMiniStageRoute}`,
  ),
  conventionStatusDashboard: defineRoute(
    { jwt: param.query.string },
    () => `/${frontRoutes.conventionStatusDashboard}`,
  ),
  conventionTemplate: defineRoute(
    {
      ...connectedUserParams,
      fromRoute: param.query.ofType(conventionTemplateFromRouteSerializer),
      conventionTemplateId: param.query.optional.string,
    },
    () => "/modele-convention",
  ),
  conventionToSign: defineRoute(
    {
      jwt: param.query.string,
      ...acquisitionParams,
    },
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
    () => `/${frontRoutes.formEstablishment}`,
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
      ...acquisitionParams,
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
  magicLinkInterstitial: defineRoute(
    {
      code: param.query.string,
      state: param.query.string,
      email: param.query.string,
    },
    () => `/${frontRoutes.magicLinkInterstitial}`,
  ),
  manageConvention: defineRoute(
    { jwt: param.query.string },
    () => `/${frontRoutes.manageConvention}`,
  ),
  manageConventionConnectedUser: defineRoute(
    { ...connectedUserParams, conventionId: param.query.string },
    () => `/${frontRoutes.manageConventionConnectedUser}`,
  ),
  openApiDoc: defineRoute(
    { version: param.query.optional.string },
    () => "/doc-api",
  ),
  search: defineRoute(searchParams, () => `/${frontRoutes.search}`),
  externalSearch: defineRoute(
    searchParams,
    () => `/${frontRoutes.externalSearch}`,
  ),
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
  temporaryError: defineRoute("/error"),
});

export const makeRouteAbsoluteUrl = (
  route: Route<typeof routes>,
  immersionFacileBaseUrl: AbsoluteUrl,
): AbsoluteUrl => {
  return `${immersionFacileBaseUrl}${route.href}`;
};
