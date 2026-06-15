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
  myAccount: "mon-compte",
  beneficiaryDashboard: "tableau-de-bord-beneficiaire",
  beneficiaryDashboardDiscussions: "tableau-de-bord-beneficiaire/discussions",
};

export const legacyFrontRoutes = {
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
  myAccount: "mon-compte",
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

export type FrontRouteUnion = ValueOf<typeof frontRoutes>;
export type FrontRouteKeys = keyof typeof frontRoutes;

export type ConventionTemplateFromRoute = Extract<
  FrontRouteKeys,
  "agencyDashboard" | "establishmentDashboard"
>;

const admin = defineRoute(
  connectedUserParams,
  () => `/${legacyFrontRoutes.admin}`,
);

const myAccount = defineRoute(
  {
    ...connectedUserParams,
    ...acquisitionParams,
  },
  () => `/${legacyFrontRoutes.myAccount}`,
);

const beneficiaryDashboard = myAccount.extend(
  `/${legacyFrontRoutes.beneficiaryDashboard}`,
);

const agencyDashboard = myAccount.extend(
  {
    isAgencyRegistration: param.query.optional.boolean,
  },
  () => [
    `/${legacyFrontRoutes.agencyDashboard}`,
    "/agence-dashboard", //legacy route redirect to frontRoutes.agencyDashboard
  ],
);

const establishmentDashboard = myAccount.extend(
  `/${legacyFrontRoutes.establishmentDashboard}`,
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

export const {
  RouteProvider,
  useRoute,
  routes: frontRoutes,
} = createRouter({
  addAgency: defineRoute(
    { ...connectedUserParams, siret: param.query.optional.string },
    () => `/${legacyFrontRoutes.addAgency}`,
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

  myAccount,
  myAccountAgencies: myAccount.extend("/mes-agences"),
  myAccountEstablishments: myAccount.extend("/mes-etablissements"),
  myAccountAgencyRegistration: myAccount.extend("/agency-registration"),
  myAccountEstablishmentRegistration: myAccount.extend(
    { siret: param.query.optional.string },
    () => `/${legacyFrontRoutes.myProfileEstablishmentRegistration}`,
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
      `/${legacyFrontRoutes.conventionImmersion}/confirmation/${conventionId}`,
  ),
  assessmentDocument: defineRoute(
    {
      jwt: param.query.optional.string,
      conventionId: param.query.optional.string,
      ...acquisitionParams,
    },
    () => `/${legacyFrontRoutes.assessmentDocument}`,
  ),
  conventionDocument: defineRoute(
    {
      jwt: param.query.optional.string,
      conventionId: param.query.optional.string,
    },
    () => `/${legacyFrontRoutes.conventionDocument}`,
  ),
  initiateConvention: defineRoute(
    {
      ...acquisitionParams,
      skipFirstStep: param.query.optional.boolean,
    },
    () => `/${legacyFrontRoutes.initiateConvention}`,
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
    () => `/${legacyFrontRoutes.conventionImmersion}`,
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
    (params) => `/${legacyFrontRoutes.conventionImmersion}/${params.consumer}`,
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
    () => `/${legacyFrontRoutes.conventionMiniStageRoute}`,
  ),
  conventionStatusDashboard: defineRoute(
    { jwt: param.query.string },
    () => `/${legacyFrontRoutes.conventionStatusDashboard}`,
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
    () => `/${legacyFrontRoutes.conventionToSign}`,
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
    () => `/${legacyFrontRoutes.formEstablishment}`,
  ),
  unregisterEstablishmentLead: defineRoute(
    {
      jwt: param.query.string,
    },
    () => `/${legacyFrontRoutes.unsubscribeEstablishmentLead}`,
  ),
  group: defineRoute(
    { groupSlug: param.path.string },
    (params) => `/${legacyFrontRoutes.group}/${params.groupSlug}`,
  ),
  home: defineRoute("/"),
  homeAgencies: defineRoute(`/${legacyFrontRoutes.homeAgencies}`),
  homeCandidates: defineRoute(`/${legacyFrontRoutes.homeCandidates}`),
  homeEstablishments: defineRoute([
    `/${legacyFrontRoutes.homeEstablishments}`,
    `/${legacyFrontRoutes.landingEstablishment}`,
  ]),
  assessment: defineRoute(
    {
      jwt: param.query.string,
      conventionId: param.query.optional.string,
      ...acquisitionParams,
    },
    () => `/${legacyFrontRoutes.assessment}`,
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
    () => `/${legacyFrontRoutes.searchResult}`,
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
    () => `/${legacyFrontRoutes.searchResultForStudent}`,
  ),
  searchResultExternal: defineRoute(
    {
      siret: param.query.string,
      appellationCode: param.query.ofType(appellationStringSerializer),
    },
    () => `/${legacyFrontRoutes.searchResultExternal}`,
  ),
  magicLinkInterstitial: defineRoute(
    {
      code: param.query.string,
      state: param.query.string,
      email: param.query.string,
    },
    () => `/${legacyFrontRoutes.magicLinkInterstitial}`,
  ),
  manageConvention: defineRoute(
    { jwt: param.query.string },
    () => `/${legacyFrontRoutes.manageConvention}`,
  ),
  manageConventionConnectedUser: defineRoute(
    { ...connectedUserParams, conventionId: param.query.string },
    () => `/${legacyFrontRoutes.manageConventionConnectedUser}`,
  ),
  openApiDoc: defineRoute(
    { version: param.query.optional.string },
    () => "/doc-api",
  ),
  search: defineRoute(searchParams, () => `/${legacyFrontRoutes.search}`),
  externalSearch: defineRoute(
    searchParams,
    () => `/${legacyFrontRoutes.externalSearch}`,
  ),
  searchForStudent: defineRoute(
    searchParams,
    () => `/${legacyFrontRoutes.searchForStudent}`,
  ),
  standard: defineRoute(
    {
      pagePath: param.path.ofType(standardPagesSerializer),
      version: param.query.optional.string,
    },
    (params) => `/${legacyFrontRoutes.standard}/${params.pagePath}`,
  ),
  stats: defineRoute("/stats"),
  temporaryError: defineRoute("/error"),
});

export const makeRouteAbsoluteUrl = ({
  route,
  baseUrl,
}: {
  route: Route<typeof frontRoutes>;
  baseUrl: AbsoluteUrl;
}): AbsoluteUrl => `${baseUrl}${route.href}`;
