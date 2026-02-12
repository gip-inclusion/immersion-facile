import {
  type ConnectedUser,
  type ConventionTemplate,
  conventionTemplateSchema,
  errors,
} from "shared";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type CreateOrUpdateConventionTemplate = ReturnType<
  typeof makeCreateOrUpdateConventionTemplate
>;

export const makeCreateOrUpdateConventionTemplate = useCaseBuilder(
  "CreateOrUpdateConventionTemplate",
)
  .withInput<ConventionTemplate>(conventionTemplateSchema)
  .withCurrentUser<ConnectedUser>()
  .withDeps<{
    timeGateway: TimeGateway;
    createNewEvent: CreateNewEvent;
  }>()
  .build(async ({ inputParams, uow, deps, currentUser }) => {
    if (!currentUser) throw errors.user.unauthorized();

    const templates = await uow.conventionTemplateQueries.get({
      ids: [inputParams.id],
    });

    if (templates.at(0) && templates.at(0)?.userId !== currentUser.id)
      throw errors.conventionTemplate.forbiddenToDeleteNotOwnedTemplate({
        conventionTemplateId: inputParams.id,
      });

    await uow.conventionTemplateQueries.upsert(
      { ...inputParams, userId: currentUser.id },
      deps.timeGateway.now().toISOString(),
    );

    const event = deps.createNewEvent({
      topic: "ConventionTemplateCreatedOrUpdated",
      payload: {
        conventionTemplateId: inputParams.id,
        triggeredBy: { kind: "connected-user", userId: currentUser.id },
      },
    });
    await uow.outboxRepository.save(event);
  });
