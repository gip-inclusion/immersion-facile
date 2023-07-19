import { ConventionDto, conventionSchema, ImmersionObjective } from "shared";
import { NotFoundError } from "../../../../adapters/primary/helpers/httpErrors";
import { TimeGateway } from "../../../core/ports/TimeGateway";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import {
  conventionStatusToPoleEmploiStatus,
  isBroadcastResponseOk,
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

export class BroadcastToPoleEmploiOnConventionUpdates extends TransactionalUseCase<
  ConventionDto,
  void
> {
  protected inputSchema = conventionSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private poleEmploiGateway: PoleEmploiGateway,
    private timeGateway: TimeGateway,
    private options: { resyncMode: boolean },
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    convention: ConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const { enablePeConventionBroadcast } =
      await uow.featureFlagRepository.getAll();

    if (!enablePeConventionBroadcast.isActive)
      return this.options.resyncMode
        ? uow.conventionsToSyncRepository.save({
            id: convention.id,
            status: "SKIP",
            processDate: this.timeGateway.now(),
            reason: "Feature flag enablePeConventionBroadcast not enabled",
          })
        : undefined;

    const [agency] = await uow.agencyRepository.getByIds([convention.agencyId]);
    if (!agency)
      throw new NotFoundError(
        `Agency with id ${convention.agencyId} missing in agencyRepository`,
      );
    if (agency.kind !== "pole-emploi")
      return this.options.resyncMode
        ? uow.conventionsToSyncRepository.save({
            id: convention.id,
            status: "SKIP",
            processDate: this.timeGateway.now(),
            reason: "Agency is not of kind pole-emploi",
          })
        : undefined;

    const { beneficiary, establishmentRepresentative } = convention.signatories;

    const poleEmploiConvention: PoleEmploiConvention = {
      id: convention.externalId
        ? convention.externalId.padStart(11, "0")
        : "no-external-id",
      originalId: convention.id,
      peConnectId: beneficiary.federatedIdentity?.token,
      statut: conventionStatusToPoleEmploiStatus[convention.status],
      email: beneficiary.email,
      telephone: beneficiary.phone,
      prenom: beneficiary.firstName,
      nom: beneficiary.lastName,
      dateNaissance: new Date(
        convention.signatories.beneficiary.birthdate,
      ).toISOString(),
      dateDemande: new Date(convention.dateSubmission).toISOString(),
      dateDebut: new Date(convention.dateStart).toISOString(),
      dateFin: new Date(convention.dateEnd).toISOString(),
      dureeImmersion: convention.schedule.totalHours,
      raisonSociale: convention.businessName,
      siret: convention.siret,
      nomPrenomFonctionTuteur: `${convention.establishmentTutor.firstName} ${convention.establishmentTutor.lastName} ${convention.establishmentTutor.job}`,
      telephoneTuteur: convention.establishmentTutor.phone,
      emailTuteur: convention.establishmentTutor.email,
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
      signatureEntreprise: !!establishmentRepresentative.signedAt,
    };

    const response = await this.poleEmploiGateway.notifyOnConventionUpdated(
      poleEmploiConvention,
    );

    if (this.options.resyncMode)
      await uow.conventionsToSyncRepository.save({
        id: convention.id,
        status: "SUCCESS",
        processDate: this.timeGateway.now(),
      });

    if (!isBroadcastResponseOk(response)) {
      await uow.errorRepository.save({
        serviceName: "PoleEmploiGateway.notifyOnConventionUpdated",
        message: response.message,
        params: { conventionId: convention.id, httpStatus: response.status },
        occurredAt: this.timeGateway.now(),
      });
    }
  }
}
