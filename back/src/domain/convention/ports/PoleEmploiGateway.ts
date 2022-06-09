import { DateStr } from "../../core/ports/Clock";

export type PoleEmploiConvention = {
  id: string; // exemple: 31bd445d-54fa-4b53-8875-0ada1673fe3c
  peConventionId: string; // id numérique sur 11 caratères
  peConnectId: string; // nécessaire pour se connecter avec PE-UX
  statut: string;
  email: string;
  telephone?: string;
  prenom: string;
  nom: string;
  dateDemande: DateStr;
  dateDebut: DateStr;
  dateFin: DateStr;
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

export interface PoleEmploiGateway {
  notifyOnConventionUpdated: (
    poleEmploiConvention: PoleEmploiConvention,
  ) => Promise<void>;
}
