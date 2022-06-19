import { differenceInMinutes } from "date-fns";
import {
  ConventionDto,
  ImmersionObjective,
} from "shared/src/convention/convention.dto";
import { z } from "zod";
import { UseCase } from "../../../core/UseCase";
import {
  PoleEmploiConvention,
  PoleEmploiGateway,
} from "../../ports/PoleEmploiGateway";

const conventionObjectiveToObjectifDeImmersion: Record<
  ImmersionObjective,
  1 | 2 | 3
> = {
  "Initier une démarche de recrutement": 1,
  "Confirmer un projet professionnel": 2,
  "Découvrir un métier ou un secteur d'activité": 3,
};

export class BroadcastToPoleEmploiOnConventionUpdates extends UseCase<
  ConventionDto,
  void
> {
  inputSchema = z.any(); // No need of a validation schema here since this use-case is only called from the our domain

  constructor(private poleEmploiGateway: PoleEmploiGateway) {
    super();
  }

  public async _execute(convention: ConventionDto): Promise<void> {
    if (!convention.federatedIdentity) return;

    const roundDifferenceInHours =
      differenceInMinutes(
        new Date(convention.dateEnd),
        new Date(convention.dateStart),
      ) / 60;

    const poleEmploiConvention: PoleEmploiConvention = {
      id: convention.externalId,
      originalId: convention.id,
      peConnectId: convention.federatedIdentity,
      status: convention.status,
      email: convention.email,
      telephone: convention.phone,
      prenom: convention.firstName,
      nom: convention.lastName,
      dateDemande: convention.dateSubmission,
      dateDebut: convention.dateStart,
      dateFin: convention.dateEnd,
      dureeImmersion: roundDifferenceInHours.toString(),
      raisonSociale: convention.businessName,
      siret: convention.siret,
      nomPrenomFonctionTuteur: convention.mentor,
      telephoneTuteur: convention.mentorPhone,
      emailTuteur: convention.mentorEmail,
      adresseImmersion: convention.immersionAddress,
      protectionIndividuelle: convention.individualProtection,
      preventionSanitaire: convention.sanitaryPrevention,
      descriptionPreventionSanitaire: convention.sanitaryPreventionDescription,
      descriptionProtectionIndividuelle: "",
      enseigne: "", // TODO : decide whether to remove this field, to add agency name to our conventionDTO, or make a request to retrieve it here.
      objectifDeImmersion:
        conventionObjectiveToObjectifDeImmersion[convention.immersionObjective],
      codeRome: convention.immersionAppellation.romeCode,
      codeAppellation: convention.immersionAppellation.appellationCode,
      activitesObservees: convention.immersionActivities,
      competencesObservees: convention.immersionSkills,
      signatureBeneficiaire: convention.beneficiaryAccepted,
      signatureEntreprise: convention.enterpriseAccepted,
    };

    await this.poleEmploiGateway.notifyOnConventionUpdated(
      poleEmploiConvention,
    );
  }
}
