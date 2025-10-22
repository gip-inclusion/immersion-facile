import {
  type AssessmentDto,
  type ConventionDto,
  type ConventionReadDto,
  errors,
} from "shared";
import type { InstantiatedUseCase } from "../../../../config/bootstrap/createUseCases";
import { agencyWithRightToAgencyDto } from "../../../../utils/agency";
import { assesmentEntityToConventionAssessmentFields } from "../../../../utils/convention";
import { getReferedAgency } from "../../../core/api-consumer/helpers/agency";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";
import type { BroadcastToFranceTravailOnConventionUpdates } from "./BroadcastToFranceTravailOnConventionUpdates";
import type { BroadcastToFranceTravailOnConventionUpdatesLegacy } from "./BroadcastToFranceTravailOnConventionUpdatesLegacy";
import type { BroadcastConventionParams } from "./broadcastConventionParams";

export type BroadcastToFranceTravailOrchestrator = ReturnType<
  typeof makeBroadcastToFranceTravailOrchestrator
>;
export const makeBroadcastToFranceTravailOrchestrator = ({
  uowPerformer,
  broadcastToFranceTravailOnConventionUpdatesLegacy,
  broadcastToFranceTravailOnConventionUpdates,
  eventType,
}: {
  uowPerformer: UnitOfWorkPerformer;
  eventType: BroadcastConventionParams["eventType"];
  broadcastToFranceTravailOnConventionUpdates: BroadcastToFranceTravailOnConventionUpdates;
  broadcastToFranceTravailOnConventionUpdatesLegacy: BroadcastToFranceTravailOnConventionUpdatesLegacy;
}): InstantiatedUseCase<{
  convention: ConventionDto;
  assessment?: AssessmentDto;
}> => {
  return {
    useCaseName: "BroadcastToFranceTravailOrchestrator",
    execute: async (params) => {
      const featureFlags = await uowPerformer.perform(async (uow) =>
        uow.featureFlagRepository.getAll(),
      );

      if (featureFlags.enableStandardFormatBroadcastToFranceTravail.isActive) {
        const { agency, agencyWithRights, referredAgency } =
          await uowPerformer.perform(async (uow) => {
            const agencyWithRights = await uow.agencyRepository.getById(
              params.convention.agencyId,
            );
            if (!agencyWithRights) {
              throw errors.agency.notFound({
                agencyId: params.convention.agencyId,
              });
            }
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
          uow.assessmentRepository.getByConventionId(params.convention.id),
        );

        const assessmentFields =
          assesmentEntityToConventionAssessmentFields(assessment);

        const conventionRead: ConventionReadDto = {
          ...params.convention,
          agencyName: agencyWithRights.name,
          agencyDepartment: agencyWithRights.address.departmentCode,
          agencyKind: agencyWithRights.kind,
          agencySiret: agencyWithRights.agencySiret,
          agencyRefersTo: referredAgency,
          agencyCounsellorEmails: agency.counsellorEmails,
          agencyValidatorEmails: agency.validatorEmails,
          ...assessmentFields,
        };

        if (eventType === "ASSESSMENT_CREATED") {
          if (!params.assessment)
            throw errors.assessment.missingAssessment({
              conventionId: params.convention.id,
            });

          return broadcastToFranceTravailOnConventionUpdates.execute({
            eventType: "ASSESSMENT_CREATED",
            convention: conventionRead,
            assessment: params.assessment,
          });
        }

        return broadcastToFranceTravailOnConventionUpdates.execute({
          eventType: "CONVENTION_UPDATED",
          convention: conventionRead,
        });
      }

      if (eventType === "CONVENTION_UPDATED") {
        return broadcastToFranceTravailOnConventionUpdatesLegacy.execute({
          convention: params.convention,
        });
      }
    },
  };
};
