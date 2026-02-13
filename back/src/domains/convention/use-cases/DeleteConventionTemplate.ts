import {
  type ConnectedUser,
  type ConventionTemplateId,
  conventionTemplateIdSchema,
  errors,
} from "shared";
import z from "zod";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import { useCaseBuilder } from "../../core/useCaseBuilder";

const deleteConventionTemplateInputSchema = z.object({
  conventionTemplateId: conventionTemplateIdSchema,
});

export const makeDeleteConventionTemplate = useCaseBuilder(
  "DeleteConventionTemplate",
)
  .withInput<{ conventionTemplateId: ConventionTemplateId }>(
    deleteConventionTemplateInputSchema,
  )
  .withCurrentUser<ConnectedUser>()
  .withDeps<{
    createNewEvent: CreateNewEvent;
  }>()
  .build(async ({ inputParams, uow, deps, currentUser }) => {
    if (!currentUser) throw errors.user.unauthorized();

    const templates = await uow.conventionTemplateQueries.get({
      ids: [inputParams.conventionTemplateId],
    });
    if (templates.length === 0)
      throw errors.conventionTemplate.notFound({
        conventionTemplateId: inputParams.conventionTemplateId,
      });

    if (templates.at(0)?.userId !== currentUser.id)
      throw errors.conventionTemplate.forbidden({
        conventionTemplateId: inputParams.conventionTemplateId,
      });

    await uow.conventionTemplateQueries.delete(
      inputParams.conventionTemplateId,
    );

    const event = deps.createNewEvent({
      topic: "ConventionTemplateDeleted",
      payload: {
        conventionTemplateId: inputParams.conventionTemplateId,
        triggeredBy: { kind: "connected-user", userId: currentUser.id },
      },
    });
    await uow.outboxRepository.save(event);
  });
