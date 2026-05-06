import {
  type ConventionReadDto,
  errors,
  type WithBannedEstablishmentInformations,
} from "shared";
import type { InstantiatedUseCase } from "../../../../config/bootstrap/createUseCases";
import { agencyWithRightToAgencyDto } from "../../../../utils/agency";
import { assesmentEntityToConventionAssessmentFields } from "../../../../utils/convention";
import { getReferedAgency } from "../../../core/api-consumer/helpers/agency";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";
import type { BannedEstablishment } from "../../../establishment/ports/BannedEstablishmentRepository";
import { getOnlyAssessmentDto } from "../../entities/AssessmentEntity";
import type { BroadcastToFranceTravailOnConventionUpdates } from "./BroadcastToFranceTravailOnConventionUpdates";
import type {
  BroadcastConventionParams,
  WithConventionIdAndPreviousAgencyId,
} from "./broadcastConventionParams";

export type BroadcastToFranceTravailOrchestrator = ReturnType<
  typeof makeBroadcastToFranceTravailOrchestrator
>;
export const makeBroadcastToFranceTravailOrchestrator = ({
  uowPerformer,
  broadcastToFranceTravailOnConventionUpdates,
  eventType,
}: {
  uowPerformer: UnitOfWorkPerformer;
  eventType: BroadcastConventionParams["eventType"];
  broadcastToFranceTravailOnConventionUpdates: BroadcastToFranceTravailOnConventionUpdates;
}): InstantiatedUseCase<WithConventionIdAndPreviousAgencyId> => {
  return {
    useCaseName: "BroadcastToFranceTravailOrchestrator",
    execute: async (params) => {
      const convention = await uowPerformer.perform(async (uow) =>
        uow.conventionRepository.getById(params.conventionId),
      );
      if (!convention)
        throw errors.convention.notFound({ conventionId: params.conventionId });

      const bannedEstablishment: BannedEstablishment | undefined =
        await uowPerformer.perform(async (uow) => {
          return uow.bannedEstablishmentRepository.getBannedEstablishmentBySiret(
            convention.siret,
          );
        });

      const withBannedEstablishmentInformations: WithBannedEstablishmentInformations =
        bannedEstablishment
          ? {
              isEstablishmentBanned: true,
              establishmentBannishmentJustification:
                bannedEstablishment.establishmentBannishmentJustification,
            }
          : { isEstablishmentBanned: false };

      const { agency, agencyWithRights, referredAgency } =
        await uowPerformer.perform(async (uow) => {
          const agencyWithRights = await uow.agencyRepository.getById(
            convention.agencyId,
          );
          if (!agencyWithRights)
            throw errors.agency.notFound({
              agencyId: convention.agencyId,
            });
          const agency = await agencyWithRightToAgencyDto(
            uow,
            agencyWithRights,
          );

          const referredAgency = agencyWithRights.refersToAgencyId
            ? await getReferedAgency(uow, agencyWithRights.refersToAgencyId)
            : undefined;

          return {
            agency,
            agencyWithRights,
            referredAgency,
          };
        });

      const assessment = await uowPerformer.perform(async (uow) =>
        uow.assessmentRepository.getByConventionId(convention.id),
      );

      const assessmentFields =
        assesmentEntityToConventionAssessmentFields(assessment);

      const conventionRead: ConventionReadDto = {
        ...convention,
        agencyName: agencyWithRights.name,
        agencyContactEmail: agencyWithRights.contactEmail,
        agencyDepartment: agencyWithRights.address.departmentCode,
        agencyKind: agencyWithRights.kind,
        agencySiret: agencyWithRights.agencySiret,
        agencyRefersTo: referredAgency,
        agencyCounsellorEmails: agency.counsellorEmails,
        agencyValidatorEmails: agency.validatorEmails,
        ...assessmentFields,
        ...withBannedEstablishmentInformations,
      };

      const assessmentDto = assessment
        ? getOnlyAssessmentDto(assessment)
        : undefined;

      if (eventType === "ASSESSMENT_CREATED") {
        if (!assessmentDto)
          throw errors.assessment.missingAssessment({
            conventionId: convention.id,
          });

        return broadcastToFranceTravailOnConventionUpdates.execute({
          eventType: "ASSESSMENT_CREATED",
          convention: conventionRead,
          assessment: assessmentDto,
        });
      }

      return broadcastToFranceTravailOnConventionUpdates.execute({
        eventType: "CONVENTION_UPDATED",
        convention: conventionRead,
        previousAgencyId: params.previousAgencyId,
      });
    },
  };
};
