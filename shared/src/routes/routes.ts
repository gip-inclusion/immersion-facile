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
  immersionAssessment: "bilan-immersion",
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

export const appellationRoute = "appellation";
export const contactEstablishmentRoute = "contact-establishment";
export const generateMagicLinkRoute = "generate-magic-link";
export const getImmersionOfferByIdRoute__v0 = "get-immersion-by-id"; // Will be removed.
export const immersionAssessmentRoute = "immersion-assessment";
export const immersionOffersApiAuthRoute__v0 = "immersion-offers";
export const immersionOffersRoute = "immersion-offers";
export const loginPeConnect = "login-pe-connect";
export const peConnect = "pe-connect";

export const requestEmailToUpdateFormRoute = "request-email-to-update-form";
export const romeRoute = "rome";
export const searchImmersionRoute__v0 = "search-immersion"; // Becomes GET /immersion-offers?rome=A100&position.lon=2.2315&position.lat=48.8531
export const uploadFileRoute = "upload-file";
