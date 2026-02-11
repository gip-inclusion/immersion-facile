import {
  type ConnectedUser,
  type ConventionTemplate,
  conventionTemplateSchema,
  errors,
} from "shared";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export const makeCreateOrUpdateConventionTemplate = useCaseBuilder(
  "CreateOrUpdateConventionTemplate",
)
  .withInput<ConventionTemplate>(conventionTemplateSchema)
  .withCurrentUser<ConnectedUser>()
  .withDeps<{
    timeGateway: TimeGateway;
  }>()
  .build(async ({ inputParams, uow, deps, currentUser }) => {
    if (!currentUser) throw errors.user.unauthorized();

    await uow.conventionTemplateQueries.upsert(
      { ...inputParams, userId: currentUser.id },
      deps.timeGateway.now().toISOString(),
    );
  });
