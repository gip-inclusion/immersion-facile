export const frontRoutes = {
  admin: "admin",
  addAgency: "ajouter-prescripteur",
  conventionRoute: "demande-immersion",
  conventionToValidate: "verification",
  conventionToSign: "verifier-et-signer",
  editFormEstablishmentRoute: "edition-etablissement",
  error: "error",
  establishment: "establishment",
  immersionAssessment: "bilan-immersion",
  landingEstablishment: "accueil-etablissement",
  magicLinkRenewal: "refraichir-lien",
  search: "recherche",
};

export const addEstablishmentFormRouteWithApiKey__v0 = "add-establishment-form"; // Becomes POST /v1/form-establishments
export const adminLogin = "login";
export const agenciesRoute = "agencies";
export const addressRoute = "address";
export const agencyImmersionFacileIdRoute = "immersion-facile-agency-id";
export const agencyPublicInfoByIdRoute = "agency-public-info-by-id";
export const appellationRoute = "appellation";
export const contactEstablishmentRoute = "contact-establishment";
export const conventionShareRoute = "share-immersion-demand";
export const conventionsRoute = "demandes-immersion";
export const emailRoute = "emails";
export const exportRoute = "export";
export const formAlreadyExistsRoute = "form-already-exists";
export const formEstablishmentsRoute = "form-establishments";
export const generateMagicLinkRoute = "generate-magic-link";
export const getFeatureFlags = "feature-flags";
export const getImmersionOfferByIdRoute__v0 = "get-immersion-by-id"; // Will be removed.
export const getSiretIfNotSavedRoute = "siret-if-not-saved";
export const immersionAssessmentRoute = "immersion-assessment";
export const immersionOffersApiAuthRoute__v0 = "immersion-offers";
export const immersionOffersRoute = "immersion-offers";
export const loginPeConnect = "login-pe-connect";
export const peConnect = "pe-connect";
export const rejectSigningConventionRoute = "reject-application";
export const renewMagicLinkRoute = "renew-magic-link";
export const requestEmailToUpdateFormRoute = "request-email-to-update-form";
export const romeRoute = "rome";
export const searchImmersionRoute__v0 = "search-immersion"; // Becomes GET /immersion-offers?rome=A100&position.lon=2.2315&position.lat=48.8531
export const signConventionRoute = "sign-application";
export const siretRoute = "siret";
export const updateConventionStatusRoute = "update-application-status";
export const uploadFileRoute = "upload-file";
export const lookupStreetAddressRoute = `/${addressRoute}/lookupStreetAddress`;
export const departmentCodeFromPostcodeRoute = `/${addressRoute}/findDepartmentCodeFromPostCode`;
