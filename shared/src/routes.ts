export const conventionsRoute = "demandes-immersion";
export const exportConventionsExcelRoute = "export-demande-immersions-excel";
export const exportEstablismentsExcelRoute = "export-establishments";
export const immersionOffersApiAuthRoute__v0 = "immersion-offers";
export const immersionOffersRoute = "immersion-offers";
export const extractConventionsExcelRoute = "extract-demande-immersion-excel";
export const addEstablishmentFormRouteWithApiKey__v0 = "add-establishment-form"; // Becomes POST /v1/form-establishments
export const validateConventionRoute = "validate-demande";
export const generateMagicLinkRoute = "generate-magic-link";
export const renewMagicLinkRoute = "renew-magic-link";
export const siretRoute = "siret";
export const getSiretIfNotSavedRoute = "siret-if-not-saved";
export const appellationRoute = "appellation";
export const romeRoute = "rome";
export const formAlreadyExistsRoute = "form-already-exists";
export const requestEmailToUpdateFormRoute = "request-email-to-update-form";
export const updateConventionStatusRoute = "update-application-status";
export const signConventionRoute = "sign-application";
export const rejectSigningConventionRoute = "reject-application";
export const searchImmersionRoute__v0 = "search-immersion"; // Becomes GET /immersion-offers?rome=A100&position.lon=2.2315&position.lat=48.8531
export const getImmersionOfferByIdRoute__v0 = "get-immersion-by-id"; // Will be removed.
export const formEstablishmentsRoute = "form-establishments";
export const agenciesRoute = "agencies";
export const agencyImmersionFacileIdRoute = "immersion-facile-agency-id";
export const agencyPublicInfoByIdRoute = "agency-public-info-by-id";
export const contactEstablishmentRoute = "contact-establishment";
export const getFeatureFlags = "feature-flags";
export const conventionShareRoute = "share-immersion-demand";
export const uploadFileRoute = "upload-file";

export const immersionAssessmentRoute = "immersion-assessment";

export const peConnect = "pe-connect";
export const loginPeConnect = "login-pe-connect";

export const frontRoutes = {
  conventionToValidate: "verification",
  conventionToSign: "verifier-et-signer",
  conventionRoute: "demande-immersion",
  immersionAssessment: "bilan-immersion",
  editFormEstablishmentRoute: "edition-etablissement",
  magicLinkRenewal: "refraichir-lien",
};
