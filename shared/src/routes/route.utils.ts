import type { PathParameters, SharedRoute, Url } from "shared-routes";
import type { UnknownResponses } from "shared-routes/defineRoutes";
import { allowedLoginSources } from "../auth/auth.dto";

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

export const frontRoutes = {
  addAgency: "ajouter-prescripteur",
  [allowedLoginSources[0]]: "admin",
  [allowedLoginSources[1]]: "establishment",
  [allowedLoginSources[2]]: "tableau-de-bord-etablissement",
  [allowedLoginSources[3]]: "tableau-de-bord-etablissement/discussions",
  [allowedLoginSources[4]]: "tableau-de-bord-agence",
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
  manageConvention: "pilotage-convention",
  manageConventionUserConnected: "pilotage-convention-inclusion-connect",
  manageEstablishmentAdmin: "pilotage-etablissement-admin",
  profile: "mon-profil",
  search: "recherche",
  searchForStudent: "recherche-scolaire",
  searchDiagoriente: "recherche-diagoriente",
  standard: "pages",
  unsubscribeEstablishmentLead: "desinscription-prospect",
};

export const loginFtConnect = "login-pe-connect";
export const ftConnect = "pe-connect";

export const uploadFileRoute = "upload-file";
