import {
  type ConnectedUser,
  type DeleteAssessmentRequestDto,
  deleteAssessmentRequestDtoSchema,
  errors,
} from "shared";
import { throwIfNotAdmin } from "../../connected-users/helpers/authorization.helper";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type DeleteAssessment = ReturnType<typeof makeDeleteAssessment>;
export const makeDeleteAssessment = useCaseBuilder("DeleteAssessment")
  .withInput<DeleteAssessmentRequestDto>(deleteAssessmentRequestDtoSchema)
  .withOutput<void>()
  .withCurrentUser<ConnectedUser>()
  .withDeps<{
    createNewEvent: CreateNewEvent;
  }>()
  .build(async ({ uow, deps, inputParams, currentUser }) => {
    throwIfNotAdmin(currentUser);

    const existingAssessment = await uow.assessmentRepository.getByConventionId(
      inputParams.conventionId,
    );
    if (!existingAssessment)
      throw errors.assessment.notFound(inputParams.conventionId);

    await uow.assessmentRepository.delete(inputParams.conventionId);

    const event = deps.createNewEvent({
      topic: "AssessmentDeleted",
      payload: {
        ...inputParams,
        triggeredBy: { kind: "connected-user", userId: currentUser.id },
      },
    });

    await uow.outboxRepository.save(event);
  });
