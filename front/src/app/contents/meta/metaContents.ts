import { AdminTab, StandardPageSlugs } from "src/app/routes/route-params";
import { routes } from "src/app/routes/routes";

export type MetaContentType = {
  title: string;
  description: string;
};

export const defaultMetaContents: MetaContentType = {
  title: "PMSMP: Immersion Facile",
  description: "Faciliter la réalisation des immersions professionnelles.",
};

export const metaContents: Record<keyof typeof routes, MetaContentType> = {
  addAgency: {
    title: "formulaire d'ajout d'un prescripteur",
    description: "",
  },
  adminTab: {
    title: "",
    description: "",
  },
  adminRoot: {
    title: "admin",
    description: "",
  },
  debugPopulateDB: {
    title: "",
    description: "",
  },
  editFormEstablishment: {
    title: "formulaire d'édition entreprise",
    description: "",
  },
  errorRedirect: {
    title: "error",
    description: "",
  },
  formEstablishment: {
    title: "formulaire de creation entreprise",
    description: "",
  },
  formEstablishmentForExternals: {
    title: "",
    description: "",
  },
  home: {
    title: "acceuil",
    description: "",
  },
  homeCandidates: {
    title: "accueil béneficiaires",
    description: "",
  },
  homeEstablishments: {
    title: "accueil entreprises",
    description: "",
  },
  homeAgencies: {
    title: "accueil prescripteurs",
    description: "",
  },
  conventionImmersion: {
    title: "demande d'immersion",
    description: "",
  },
  conventionMiniStage: {
    title: "demande de mini-stage",
    description: "",
  },
  conventionForUkraine: {
    title: "les entreprises s'engagent pour l'ukraine",
    description: "",
  },
  conventionToValidate: {
    title: "vérification",
    description: "",
  },
  conventionToSign: {
    title: "verifier et signer",
    description: "",
  },
  conventionStatusDashboard: {
    title: "statut convention",
    description: "",
  },
  immersionAssessment: {
    title: "bilan d'immersion",
    description: "",
  },
  renewConventionMagicLink: {
    title: "refraichir le lien",
    description: "",
  },
  searchDebug: {
    title: "",
    description: "",
  },
  stats: {
    title: "stats",
    description: "",
  },
  search: {
    title: "recherche",
    description: "",
  },
  standard: {
    title: "",
    description: "",
  },
};

export const standardMetaContent: Record<StandardPageSlugs, MetaContentType> = {
  "mentions-legales": {
    title: "mentions legales",
    description: "",
  },
  cgu: {
    title: "conditions générales d'utilisation",
    description: "pages des conditions générales d'utilisations",
  },
  "politique-de-confidentialite": {
    title: "politique de confidentialité",
    description: "",
  },
  "declaration-accessibilite": {
    title: "déclaration d'accessibilité",
    description: "",
  },
};

export const adminMetaContent: Record<AdminTab, MetaContentType> = {
  conventions: {
    title: "admin: conventions",
    description: "",
  },
  events: {
    title: "admin: evenement",
    description: "",
  },
  "agency-validation": {
    title: "admin: validation d'agence",
    description: "",
  },
  exports: {
    title: "admin: export de données",
    description: "",
  },
  emails: {
    title: "admin: emails",
    description: "",
  },
  "technical-options": {
    title: "admin: options techniques",
    description: "",
  },
  "email-preview": {
    title: "admin: aperçus email",
    description: "",
  },
};
