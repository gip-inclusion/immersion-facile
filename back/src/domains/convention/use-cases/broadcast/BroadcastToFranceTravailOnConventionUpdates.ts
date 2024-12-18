import {
  AgencyDto,
  AgencyKind,
  ConventionDto,
  FeatureFlags,
  ImmersionObjective,
  WithConventionDto,
  errors,
  withConventionSchema,
} from "shared";
import { agencyWithRightToAgencyDto } from "../../../../utils/agency";
import { TransactionalUseCase } from "../../../core/UseCase";
import { broadcastToPeServiceName } from "../../../core/saved-errors/ports/BroadcastFeedbacksRepository";
import { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";
import {
  PoleEmploiConvention,
  PoleEmploiGateway,
  conventionStatusToPoleEmploiStatus,
  isBroadcastResponseOk,
} from "../../ports/PoleEmploiGateway";

const conventionObjectiveToObjectifDeImmersion: Record<
  ImmersionObjective,
  1 | 2 | 3
> = {
  "Découvrir un métier ou un secteur d'activité": 1,
  "Confirmer un projet professionnel": 2,
  "Initier une démarche de recrutement": 3,
};

export class BroadcastToFranceTravailOnConventionUpdates extends TransactionalUseCase<WithConventionDto> {
  protected inputSchema = withConventionSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private poleEmploiGateway: PoleEmploiGateway,
    private timeGateway: TimeGateway,
    private options: { resyncMode: boolean },
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    { convention }: WithConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const { agency, refersToAgency } = await getLinkedAgencies(uow, convention);
    const featureFlags = await uow.featureFlagRepository.getAll();

    if (
      !shouldBroadcastToFranceTravail({
        agency: agency,
        refersToAgency: refersToAgency,
        featureFlags,
      })
    )
      return this.options.resyncMode
        ? uow.conventionsToSyncRepository.save({
            id: convention.id,
            status: "SKIP",
            processDate: this.timeGateway.now(),
            reason: "Agency is not of kind pole-emploi",
          })
        : undefined;

    const { beneficiary, establishmentRepresentative } = convention.signatories;

    const externalId =
      await uow.conventionExternalIdRepository.getByConventionId(convention.id);

    const poleEmploiConvention: PoleEmploiConvention = {
      id: externalId ?? "no-external-id",
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
      typeAgence:
        agency.kind === "pole-emploi" ? "france-travail" : agency.kind,
      nomAgence: agency.name,
      prenomValidateurRenseigne:
        convention.validators?.agencyValidator?.firstname,
      nomValidateurRenseigne: convention.validators?.agencyValidator?.lastname,
      rqth: convention.signatories.beneficiary.isRqth ? "O" : "N",
      prenomTuteur: convention.establishmentTutor.firstName,
      nomTuteur: convention.establishmentTutor.lastName,
      fonctionTuteur: convention.establishmentTutor.job,
    };

    const response =
      await this.poleEmploiGateway.notifyOnConventionUpdated(
        poleEmploiConvention,
      );

    if (this.options.resyncMode)
      await uow.conventionsToSyncRepository.save({
        id: convention.id,
        status: "SUCCESS",
        processDate: this.timeGateway.now(),
      });

    await uow.broadcastFeedbacksRepository.save({
      consumerId: null,
      consumerName: "France Travail",
      serviceName: broadcastToPeServiceName,
      requestParams: {
        conventionId: convention.id,
        conventionStatus: convention.status,
      },
      response: { httpStatus: response.status, body: response.body },
      occurredAt: this.timeGateway.now(),
      handledByAgency: false,
      ...(!isBroadcastResponseOk(response)
        ? { subscriberErrorFeedback: response.subscriberErrorFeedback }
        : {}),
    });
  }
}

const getLinkedAgencies = async (
  uow: UnitOfWork,
  convention: ConventionDto,
): Promise<{ agency: AgencyDto; refersToAgency: AgencyDto | null }> => {
  const agencyWithRights = await uow.agencyRepository.getById(
    convention.agencyId,
  );
  if (!agencyWithRights)
    throw errors.agency.notFound({ agencyId: convention.agencyId });

  const agency = await agencyWithRightToAgencyDto(uow, agencyWithRights);

  if (!agency.refersToAgencyId) return { agency, refersToAgency: null };

  const refersToAgency = await uow.agencyRepository.getById(
    agency.refersToAgencyId,
  );

  if (!refersToAgency)
    throw errors.agency.notFound({ agencyId: agency.refersToAgencyId });

  return {
    agency,
    refersToAgency: await agencyWithRightToAgencyDto(uow, refersToAgency),
  };
};

const shouldBroadcastToFranceTravail = ({
  agency,
  featureFlags,
  refersToAgency,
}: {
  agency: AgencyDto;
  refersToAgency: AgencyDto | null;
  featureFlags: FeatureFlags;
}): boolean => {
  const isBroadcastToFranceTravailAllowedForKind = (agencyKind: AgencyKind) => {
    if (agency.kind === agencyKind) return true;
    if (refersToAgency && refersToAgency.kind === "pole-emploi") return true;
    return false;
  };

  if (isBroadcastToFranceTravailAllowedForKind("pole-emploi")) return true;

  if (
    featureFlags.enableBroadcastOfMissionLocaleToFT.isActive &&
    isBroadcastToFranceTravailAllowedForKind("mission-locale")
  )
    return true;

  if (
    featureFlags.enableBroadcastOfConseilDepartementalToFT.isActive &&
    isBroadcastToFranceTravailAllowedForKind("conseil-departemental")
  )
    return true;

  if (
    featureFlags.enableBroadcastOfCapEmploiToFT.isActive &&
    isBroadcastToFranceTravailAllowedForKind("cap-emploi")
  )
    return true;

  return false;
};
