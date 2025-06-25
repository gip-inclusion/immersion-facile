export type AllowedStartOAuthLoginPage =
  (typeof allowedStartOAuthLoginPages)[number];
export const allowedStartOAuthLoginPages = [
  "admin",
  "establishment",
  "establishmentDashboard",
  "establishmentDashboardDiscussions",
  "agencyDashboard",
] as const;

export const frontRoutes = {
  addAgency: "ajouter-prescripteur",
  [allowedStartOAuthLoginPages[0]]: "admin",
  [allowedStartOAuthLoginPages[1]]: "establishment",
  [allowedStartOAuthLoginPages[2]]: "tableau-de-bord-etablissement",
  [allowedStartOAuthLoginPages[3]]: "tableau-de-bord-etablissement/discussions",
  [allowedStartOAuthLoginPages[4]]: "tableau-de-bord-agence",
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
  manageConventionInclusionConnected: "pilotage-convention-inclusion-connect",
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
