import { type ConnectedUser, type ConventionTemplate, errors } from "shared";
import z from "zod";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export const makeGetConventionTemplatesForCurrentUser = useCaseBuilder(
  "GetConventionTemplatesForCurrentUser",
)
  .withInput<void>(z.void())
  .withOutput<ConventionTemplate[]>()
  .withCurrentUser<ConnectedUser>()
  .build(async ({ uow, currentUser }) => {
    if (!currentUser) throw errors.user.unauthorized();
    return uow.conventionTemplateQueries.get({
      userIds: [currentUser.id],
    });
  });
