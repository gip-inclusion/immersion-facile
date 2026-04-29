import {
  type AssessmentDto,
  assessmentInputDtoSchema,
  type ConventionDto,
  type ConventionRelatedJwtPayload,
  computeScheduledHoursForAssessment,
  errors,
  ForbiddenError,
} from "shared";
import { agencyWithRightToAgencyDto } from "../../../utils/agency";
import { throwForbiddenIfNotAllowedForAssessments } from "../../../utils/assessment";
import type { TriggeredBy } from "../../core/events/events";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import {
  type AssessmentEntity,
  createAssessmentEntity,
} from "../entities/AssessmentEntity";
import { retrieveConventionWithAgency } from "../entities/Convention";

type WithCreateNewEvent = { createNewEvent: CreateNewEvent };

export type CreateAssessment = ReturnType<typeof makeCreateAssessment>;
export const makeCreateAssessment = useCaseBuilder("CreateAssessment")
  .withInput(assessmentInputDtoSchema)
  .withOutput<void>()
  .withCurrentUser<ConventionRelatedJwtPayload | undefined>()
  .withDeps<WithCreateNewEvent>()
  .build(
    async ({
      inputParams: { conventionStartDate, conventionTotalHours, ...assessment },
      uow,
      deps,
      currentUser: conventionJwtPayload,
    }) => {
      if (!conventionJwtPayload)
        throw new ForbiddenError("No magic link provided");

      const { agency, convention } = await retrieveConventionWithAgency(
        uow,
        assessment.conventionId,
      );

      if (conventionStartDate !== convention.dateStart)
        throw errors.assessment.conventionDateStartMismatch(convention.id);

      await throwForbiddenIfNotAllowedForAssessments({
        mode: "CreateAssessment",
        convention,
        agency: await agencyWithRightToAgencyDto(uow, agency),
        jwtPayload: conventionJwtPayload,
        uow,
      });

      if (
        assessment.status === "PARTIALLY_COMPLETED" &&
        assessment.lastDayOfPresence &&
        (new Date(assessment.lastDayOfPresence) <
          new Date(convention.dateStart) ||
          new Date(assessment.lastDayOfPresence) > new Date(convention.dateEnd))
      )
        throw errors.assessment.lastDayOfPresenceNotInConventionRange();

      const scheduledHours = computeScheduledHoursForAssessment({
        convention,
        status: assessment.status,
        lastDayOfPresence:
          assessment.status === "PARTIALLY_COMPLETED"
            ? assessment.lastDayOfPresence
            : undefined,
      });

      if (conventionTotalHours !== convention.schedule.totalHours)
        throw errors.assessment.conventionTotalHoursMismatch(convention.id);

      if (
        assessment.status === "PARTIALLY_COMPLETED" &&
        assessment.numberOfMissedHours > scheduledHours
      )
        throw errors.assessment.numberOfMissedHoursExceedsScheduled();

      const assessmentEntity = await createAssessmentEntityIfNotExist(
        uow,
        convention,
        assessment,
      );

      const triggeredBy: TriggeredBy =
        "role" in conventionJwtPayload
          ? {
              kind: "convention-magic-link",
              role: conventionJwtPayload.role,
            }
          : {
              kind: "connected-user",
              userId: conventionJwtPayload.userId,
            };
      await Promise.all([
        uow.assessmentRepository.save(assessmentEntity),
        uow.outboxRepository.save(
          deps.createNewEvent({
            topic: "AssessmentCreated",
            payload: {
              convention,
              assessment,
              triggeredBy,
            },
          }),
        ),
      ]);
    },
  );

const createAssessmentEntityIfNotExist = async (
  uow: UnitOfWork,
  convention: ConventionDto,
  assessment: AssessmentDto,
): Promise<AssessmentEntity> => {
  const existingAssessmentEntity =
    await uow.assessmentRepository.getByConventionId(convention.id);

  if (existingAssessmentEntity)
    throw errors.assessment.alreadyExist(convention.id);

  return createAssessmentEntity(assessment, convention);
};
