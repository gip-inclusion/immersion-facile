import { ConventionStatus, DateIsoString } from "shared";

// This is an interface contract with Pole Emploi (conventions broadcast).
// ⚠️ Beware of NOT breaking contract ! ⚠️
// Doc is here : https://pad.incubateur.net/6p38o0mNRfmc8WuJ77Xr0w?view

export const conventionStatusToPoleEmploiStatus = {
  READY_TO_SIGN: "DEMANDE_A_SIGNER",
  PARTIALLY_SIGNED: "PARTIELLEMENT_SIGNÉ",
  IN_REVIEW: "DEMANDE_A_ETUDIER",
  ACCEPTED_BY_COUNSELLOR: "DEMANDE_ELIGIBLE",
  ACCEPTED_BY_VALIDATOR: "DEMANDE_VALIDÉE",

  // si demande de modifications
  DRAFT: "BROUILLON",

  // si rejeté
  REJECTED: "REJETÉ",
  CANCELLED: "DEMANDE_ANNULEE",
  DEPRECATED: "DEMANDE_OBSOLETE",

  // // à venir potentiellement
  // ABANDONNED: "ABANDONNÉ",
  // CONVENTION_SENT: "CONVENTION_ENVOYÉE",
} as const satisfies Record<ConventionStatus, string>;

type ConventionStatusToPeStatus = typeof conventionStatusToPoleEmploiStatus;
type PeConventionStatus =
  ConventionStatusToPeStatus[keyof ConventionStatusToPeStatus];

export type PoleEmploiConvention = {
  id: string; // id numérique sur 11 caractères
  originalId: string; // exemple: 31bd445d-54fa-4b53-8875-0ada1673fe3c
  peConnectId?: string; // nécessaire pour se connecter avec PE-UX
  statut: PeConventionStatus;
  email: string;
  telephone?: string;
  prenom: string;
  nom: string;
  dateNaissance: DateIsoString;
  dateDemande: DateIsoString;
  dateDebut: DateIsoString;
  dateFin: DateIsoString;
  dureeImmersion: number; // Ex : 20.75 (pour 20h45min)
  raisonSociale: string;
  siret: string;
  nomPrenomFonctionTuteur: string;
  telephoneTuteur: string;
  emailTuteur: string;
  adresseImmersion: string;
  protectionIndividuelle: boolean;
  preventionSanitaire: boolean;
  descriptionPreventionSanitaire: string;
  objectifDeImmersion: 1 | 2 | 3;
  codeRome: string;
  codeAppellation: string;
  activitesObservees: string;
  competencesObservees: string;
  signatureBeneficiaire: boolean;
  signatureEntreprise: boolean;
};

type PeBroadcastSuccessResponse = { status: 200 | 201 };
type PeBroadcastErrorResponse = { status: number; message: string };

export type PoleEmploiBroadcastResponse =
  | PeBroadcastSuccessResponse
  | PeBroadcastErrorResponse;

export const isBroadcastResponseOk = (
  response: PoleEmploiBroadcastResponse,
): response is PeBroadcastSuccessResponse =>
  [200, 201].includes(response.status);

export interface PoleEmploiGateway {
  notifyOnConventionUpdated: (
    poleEmploiConvention: PoleEmploiConvention,
  ) => Promise<PoleEmploiBroadcastResponse>;
}
