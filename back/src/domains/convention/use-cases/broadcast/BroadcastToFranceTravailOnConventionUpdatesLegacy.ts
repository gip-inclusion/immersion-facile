import {
  type ImmersionObjective,
  type WithConventionDto,
  withConventionSchema,
} from "shared";
import { broadcastToFtLegacyServiceName } from "../../../core/saved-errors/ports/BroadcastFeedbacksRepository";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../../core/useCaseBuilder";
import {
  getLinkedAgencies,
  shouldBroadcastToFranceTravail,
} from "../../entities/Convention";
import {
  conventionStatusToFranceTravailStatus,
  type FranceTravailConvention,
  type FranceTravailGateway,
  isBroadcastResponseOk,
} from "../../ports/FranceTravailGateway";

const conventionObjectiveToObjectifDeImmersion: Record<
  ImmersionObjective,
  1 | 2 | 3
> = {
  "Découvrir un métier ou un secteur d'activité": 1,
  "Confirmer un projet professionnel": 2,
  "Initier une démarche de recrutement": 3,
};

export type BroadcastToFranceTravailOnConventionUpdatesLegacy = ReturnType<
  typeof makeBroadcastToFranceTravailOnConventionUpdatesLegacy
>;
export const makeBroadcastToFranceTravailOnConventionUpdatesLegacy =
  useCaseBuilder("BroadcastToFranceTravailOnConventionUpdatesLegacy")
    .withInput<WithConventionDto>(withConventionSchema)
    .withDeps<{
      franceTravailGateway: FranceTravailGateway;
      timeGateway: TimeGateway;
      options: { resyncMode: boolean };
    }>()
    .build(async ({ uow, inputParams: { convention }, deps }) => {
      const { agency, refersToAgency } = await getLinkedAgencies(
        uow,
        convention,
      );
      const featureFlags = await uow.featureFlagRepository.getAll();

      if (
        !shouldBroadcastToFranceTravail({
          agency: agency,
          refersToAgency: refersToAgency,
          featureFlags,
        })
      )
        return deps.options.resyncMode
          ? uow.conventionsToSyncRepository.save({
              id: convention.id,
              status: "SKIP",
              processDate: deps.timeGateway.now(),
              reason: "Agency is not of kind pole-emploi",
            })
          : undefined;

      const { beneficiary, establishmentRepresentative } =
        convention.signatories;

      const externalId =
        await uow.conventionExternalIdRepository.getByConventionId(
          convention.id,
        );

      const franceTravailConvention: FranceTravailConvention = {
        id: externalId ?? "no-external-id",
        originalId: convention.id,
        peConnectId: beneficiary.federatedIdentity?.token,
        statut: conventionStatusToFranceTravailStatus[convention.status],
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
        descriptionPreventionSanitaire:
          convention.sanitaryPreventionDescription,
        objectifDeImmersion:
          conventionObjectiveToObjectifDeImmersion[
            convention.immersionObjective
          ],
        codeRome: convention.immersionAppellation.romeCode,
        codeAppellation:
          convention.immersionAppellation.appellationCode.padStart(6, "0"),
        activitesObservees: convention.immersionActivities,
        competencesObservees: convention.immersionSkills,
        signatureBeneficiaire: !!beneficiary.signedAt,
        signatureEntreprise: !!establishmentRepresentative.signedAt,
        typeAgence:
          agency.kind === "pole-emploi" ? "france-travail" : agency.kind,
        nomAgence: agency.name,
        prenomValidateurRenseigne:
          convention.validators?.agencyValidator?.firstname,
        nomValidateurRenseigne:
          convention.validators?.agencyValidator?.lastname,
        rqth: convention.signatories.beneficiary.isRqth ? "O" : "N",
        prenomTuteur: convention.establishmentTutor.firstName,
        nomTuteur: convention.establishmentTutor.lastName,
        fonctionTuteur: convention.establishmentTutor.job,
      };

      const response =
        await deps.franceTravailGateway.notifyOnConventionUpdatedLegacy(
          franceTravailConvention,
        );

      if (deps.options.resyncMode)
        await uow.conventionsToSyncRepository.save({
          id: convention.id,
          status: "SUCCESS",
          processDate: deps.timeGateway.now(),
        });

      await uow.broadcastFeedbacksRepository.save({
        consumerId: null,
        consumerName: "France Travail",
        serviceName: broadcastToFtLegacyServiceName,
        requestParams: {
          conventionId: convention.id,
          conventionStatus: convention.status,
        },
        response: { httpStatus: response.status, body: response.body },
        occurredAt: deps.timeGateway.now(),
        handledByAgency: false,
        ...(!isBroadcastResponseOk(response)
          ? { subscriberErrorFeedback: response.subscriberErrorFeedback }
          : {}),
      });
    });
