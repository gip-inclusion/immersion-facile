import { DateStr } from "../../core/ports/Clock";

export type PoleEmploiConvention = {
  id: string; // id numérique sur 11 caratères
  originalId: string; // exemple: 31bd445d-54fa-4b53-8875-0ada1673fe3c
  peConnectId: string; // nécessaire pour se connecter avec PE-UX
  status: string; // changed until PE is ready to accept "statut"
  email: string;
  telephone?: string;
  prenom: string;
  nom: string;
  dateDemande: DateStr;
  dateDebut: DateStr;
  dateFin: DateStr;
  dureeImmersion: string; // Ex : 20.75 (pour 20h45min) -> should be number but until PE is ready we convert it to string
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
