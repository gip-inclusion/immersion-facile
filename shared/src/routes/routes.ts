export type AllowedStartOAuthLoginPage =
  (typeof allowedStartOAuthLoginPages)[number];
export const allowedStartOAuthLoginPages = [
  "agencyDashboard",
  "establishmentDashboard",
  "admin",
  "establishment",
] as const;

export const frontRoutes = {
  addAgency: "ajouter-prescripteur",
  [allowedStartOAuthLoginPages[0]]: "tableau-de-bord-agence",
  [allowedStartOAuthLoginPages[1]]: "tableau-de-bord-etablissement",
  [allowedStartOAuthLoginPages[2]]: "admin",
  assessmentDocument: "bilan-document",
  beneficiaryDashboard: "tableau-de-bord-beneficiaire",
  initiateConvention: "initier-convention",
  conventionImmersionRoute: "demande-immersion",
  conventionDocument: "convention-immersion",
  conventionMiniStageRoute: "demande-mini-stage",
  conventionStatusDashboard: "statut-convention",
  conventionToSign: "verifier-et-signer",
  error: "error",
  establishment: "establishment",
  group: "groupe",
  homeAgencies: "accueil-prescripteurs",
  homeCandidates: "accueil-beneficiaires",
  homeEstablishments: "accueil-entreprises",
  assessment: "bilan-immersion",
  offer: "offre",
  offerExternal: "tentez-votre-chance",
  landingEstablishment: "accueil-etablissement",
  magicLinkRenewal: "refraichir-lien",
  manageConvention: "pilotage-convention",
  manageConventionInclusionConnected: "pilotage-convention-inclusion-connect",
  manageDiscussion: "pilotage-mise-en-relation",
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
