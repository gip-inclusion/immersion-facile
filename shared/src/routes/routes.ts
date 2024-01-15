export const allowedStartInclusionConnectLoginPages = [
  "agencyDashboard",
  "establishmentDashboard",
] as const;

export const frontRoutes = {
  addAgency: "ajouter-prescripteur",
  admin: "admin",
  [allowedStartInclusionConnectLoginPages[0]]: "tableau-de-bord-agence",
  [allowedStartInclusionConnectLoginPages[1]]: "tableau-de-bord-etablissement",
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
  manageConventionAdmin: "pilotage-convention-admin",
  manageConventionInclusionConnected: "pilotage-convention-inclusion-connect",
  manageEstablishmentAdmin: "pilotage-etablissement-admin",
  search: "recherche",
  standard: "pages",
};

export const contactEstablishmentRoute = "contact-establishment";

export const immersionOffersRoute = "immersion-offers";
export const loginPeConnect = "login-pe-connect";
export const peConnect = "pe-connect";

export const uploadFileRoute = "upload-file";
