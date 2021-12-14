import { LaPlateFormeDeLInclusionPoste } from "../domain/immersionOffer/ports/LaPlateformeDeLInclusionAPI";
import { Builder } from "./Builder";

const validLaPlateFormeDeLInclusionPoste: LaPlateFormeDeLInclusionPoste = {
  id: 12191,
  rome: "Secrétariat (M1607)",
  cree_le: new Date("2020-12-15T14:34:54.601977+01:00"),
  mis_a_jour_le: new Date("2021-09-21T10:38:49.849730+02:00"),
  recrutement_ouvert: "True",
  description:
    "La secrétaire exécute des travaux administratifs courants (vérification de documents, frappe et mise en forme des courriers préétablis, suivi de dossier administratif, ...) selon l'organisation de la structure ou du service. Elle peut être en charge des activités de reprographie et d'archivage. Elle peut réaliser l'accueil de la structure. \r\n\r\n\r\nLieu de travail : Service SOLI’BUS à BOULAY\r\n\r\nActivité : Constitue des dossiers administratifs, Gère la planification du Transport à la demande, Assure l'accueil téléphonique et physique, Encaissement, Numérise les documents\r\n\r\nCompétences : Maitrise de l'outil informatique : Word, Excel, Bonne connaissance du français, Gestion administrative, Méthode de classement et d'archivage \r\n\r\nModalités : CDDI temps partiel de 4 mois renouvelable jusqu'à 2 ans maximum, base 26h/semaine, Salaire : SMIC\r\n\r\nQualités requises : Rigueur, Sens des responsabilités, Discrétion, Capacités relationnelles, Autonomie, Organisation et méthodologie, Disponibilité, Respect du secret professionnel, Aptitude à rendre compte, \r\n\r\nConditions d'accès : Éligible à un contrat aidé, Diplôme de fin d'études secondaires à Bac dans le secteur du tertiaire, Accessible avec expérience professionnelle, sans diplôme particulier. Habiter dans une commune de la Communauté de Communes de la Houve et du Pays Boulageois ou une une commune proche (maximum 30 km de Boulay)",
  appellation_modifiee:
    "Secrétaire au sein d'un service de transport à la demande",
};

export class LaPlateFormeDeLInclusionPosteBuilder
  implements Builder<LaPlateFormeDeLInclusionPoste>
{
  public constructor(
    private entity: LaPlateFormeDeLInclusionPoste = validLaPlateFormeDeLInclusionPoste,
  ) {}

  public withRome(rome: string): LaPlateFormeDeLInclusionPosteBuilder {
    return new LaPlateFormeDeLInclusionPosteBuilder({
      ...this.entity,
      rome,
    });
  }
  public build() {
    return this.entity;
  }
}
