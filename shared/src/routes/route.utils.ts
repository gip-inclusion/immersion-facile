import type { PathParameters, SharedRoute, Url } from "shared-routes";
import type { UnknownResponses } from "shared-routes/defineRoutes";
import type { AllowedLoginSource } from "../auth/auth.dto";
import type { RawQueryParams } from "../utils/queryParams";
import { queryParamsAsString } from "../utils/queryParams";

export const makeUrlWithParams = <
  U extends Url,
  R extends SharedRoute<U, unknown, unknown, UnknownResponses, unknown>,
>(
  route: R,
  params: PathParameters<R["url"]>,
): Url =>
  route.url.replace(
    /:(\w+)/g,
    (_, paramName) => (params as any)[paramName],
  ) as U;

export const makeUrlWithQueryParams = <U extends Url>(
  url: U,
  queryParams: RawQueryParams,
): Url => {
  const queryString = queryParamsAsString(queryParams);
  return (queryString ? `${url}?${queryString}` : url) as Url;
};

const allowedLoginSourcesRoutes: Record<AllowedLoginSource, string> = {
  admin: "admin",
  establishment: "establishment",
  establishmentDashboard: "tableau-de-bord-etablissement",
  establishmentDashboardDiscussions:
    "tableau-de-bord-etablissement/discussions",
  agencyDashboard: "tableau-de-bord-agence",
  addAgency: "ajouter-prescripteur",
  manageConventionUserConnected: "pilotage-convention-inclusion-connect",
};

export const frontRoutes = {
  ...allowedLoginSourcesRoutes,
  assessmentDocument: "bilan-document",
  beneficiaryDashboard: "tableau-de-bord-beneficiaire",
  initiateConvention: "initier-convention",
  conventionImmersionRoute: "demande-immersion",
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
  magicLinkRenewal: "refraichir-lien",
  magicLinkInterstitial: "connexion-interstitiel",
  manageConvention: "pilotage-convention",
  manageEstablishmentAdmin: "pilotage-etablissement-admin",
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
