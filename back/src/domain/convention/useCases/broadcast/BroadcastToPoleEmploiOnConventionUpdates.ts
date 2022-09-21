import {
  ConventionDto,
  ConventionStatus,
  ImmersionObjective,
} from "shared/src/convention/convention.dto";
import { calculateTotalImmersionHoursBetweenDate } from "shared/src/schedule/ScheduleUtils";
import { z } from "zod";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import {
  PoleEmploiConvention,
  PoleEmploiGateway,
} from "../../ports/PoleEmploiGateway";

const conventionObjectiveToObjectifDeImmersion: Record<
  ImmersionObjective,
  1 | 2 | 3
> = {
  "Découvrir un métier ou un secteur d'activité": 1,
  "Confirmer un projet professionnel": 2,
  "Initier une démarche de recrutement": 3,
};

const conventionStatusToPoleEmploiStatus: Record<ConventionStatus, string> = {
  READY_TO_SIGN: "A_SIGNER",
  PARTIALLY_SIGNED: "PARTIELLEMENT_SIGNÉ",
  IN_REVIEW: "DEMANDE_A_ETUDIER",
  ACCEPTED_BY_COUNSELLOR: "DEMANDE_ELIGIBLE",
  ACCEPTED_BY_VALIDATOR: "DEMANDE_VALIDÉE",

  // si demande de modifications
  DRAFT: "BROUILLON",

  // si rejeté
  REJECTED: "REJETÉ",
  CANCELLED: "DEMANDE_ANNULEE",

  // // à venir potentiellement
  // ABANDONNED: "ABANDONNÉ",
  // CONVENTION_SENT: "CONVENTION_ENVOYÉE",
};

export class BroadcastToPoleEmploiOnConventionUpdates extends TransactionalUseCase<
  ConventionDto,
  void
> {
  inputSchema: z.Schema<ConventionDto> = z.any(); // No need of a validation schema here since this use-case is only called from the our domain

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private poleEmploiGateway: PoleEmploiGateway,
  ) {
    super(uowPerformer);
  }
  //
  public async _execute(
    convention: ConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const { enablePeConventionBroadcast } =
      await uow.featureFlagRepository.getAll();
    const { mentor, beneficiary } = convention.signatories;

    if (!enablePeConventionBroadcast) return;
    if (!beneficiary.federatedIdentity) return;

    const totalHours = calculateTotalImmersionHoursBetweenDate({
      schedule: convention.schedule,
      dateStart: convention.dateStart,
      dateEnd: convention.dateEnd,
    });

    const poleEmploiConvention: PoleEmploiConvention = {
      id: convention.externalId
        ? convention.externalId.padStart(11, "0")
        : "no-external-id",
      originalId: convention.id,
      peConnectId: beneficiary.federatedIdentity.replace("peConnect:", ""),
      status: conventionStatusToPoleEmploiStatus[convention.status],
      email: beneficiary.email,
      telephone: beneficiary.phone,
      prenom: beneficiary.firstName,
      nom: beneficiary.lastName,
      dateDemande: new Date(convention.dateSubmission).toISOString(),
      dateDebut: new Date(convention.dateStart).toISOString(),
      dateFin: new Date(convention.dateEnd).toISOString(),
      dureeImmersion: totalHours.toString(),
      raisonSociale: convention.businessName,
      siret: convention.siret,
      nomPrenomFonctionTuteur: `${mentor.firstName} ${mentor.lastName} ${mentor.job}`,
      telephoneTuteur: mentor.phone,
      emailTuteur: mentor.email,
      adresseImmersion: convention.immersionAddress,
      protectionIndividuelle: convention.individualProtection,
      preventionSanitaire: convention.sanitaryPrevention,
      descriptionPreventionSanitaire: convention.sanitaryPreventionDescription,
      objectifDeImmersion:
        conventionObjectiveToObjectifDeImmersion[convention.immersionObjective],
      codeRome: convention.immersionAppellation.romeCode,
      codeAppellation: convention.immersionAppellation.appellationCode.padStart(
        6,
        "0",
      ),
      activitesObservees: convention.immersionActivities,
      competencesObservees: convention.immersionSkills,
      signatureBeneficiaire: !!beneficiary.signedAt,
      signatureEntreprise: !!mentor.signedAt,

      descriptionProtectionIndividuelle: "",
      enseigne: "", // TODO : decide whether to remove this field, to add agency name to our conventionDTO, or make a request to retrieve it here.
    };

    await this.poleEmploiGateway.notifyOnConventionUpdated(
      poleEmploiConvention,
    );
  }
}
