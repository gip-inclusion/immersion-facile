export type AllowedStartInclusionConnectLoginPage =
  (typeof allowedStartInclusionConnectLoginPages)[number];
export const allowedStartInclusionConnectLoginPages = [
  "agencyDashboard",
  "establishmentDashboard",
  "admin",
] as const;

export const frontRoutes = {
  addAgency: "ajouter-prescripteur",
  [allowedStartInclusionConnectLoginPages[0]]: "tableau-de-bord-agence",
  [allowedStartInclusionConnectLoginPages[1]]: "tableau-de-bord-etablissement",
  [allowedStartInclusionConnectLoginPages[2]]: "admin",
  beneficiaryDashboard: "tableau-de-bord-beneficiaire",
  initiateConvention: "initier-convention",
  conventionImmersionRoute: "demande-immersion",
  conventionDocument: "convention-immersion",
  conventionMiniStageRoute: "demande-mini-stage",
  conventionStatusDashboard: "statut-convention",
  conventionToSign: "verifier-et-signer",
  editFormEstablishmentRoute: "edition-etablissement",
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
  searchDiagoriente: "recherche-diagoriente",
  standard: "pages",
  unsubscribeEstablishmentLead: "desinscription-prospect",
};

export const loginPeConnect = "login-pe-connect";
export const peConnect = "pe-connect";

export const uploadFileRoute = "upload-file";
