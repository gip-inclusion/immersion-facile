import {
  type ApiConsumer,
  type ConventionReadDto,
  errors,
  ForbiddenError,
  withConventionIdSchema,
} from "shared";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import { isConventionInScope } from "../entities/Convention";

export type GetConventionForApiConsumer = ReturnType<
  typeof makeGetConventionForApiConsumer
>;

// TODO: Question de fond - GetConventionForApiConsumer c'est une query sans ajout de data? Besoin d'un transactional usecase ?
// TODO: GetConventionForApiConsumer & GetConvention > on ne peut pas mutualiser ?

export const makeGetConventionForApiConsumer = useCaseBuilder(
  "GetConventionForApiConsumer",
)
  .withInput(withConventionIdSchema)
  .withOutput<ConventionReadDto>()
  .withCurrentUser<ApiConsumer>()
  .build(async ({ inputParams: { conventionId }, uow, currentUser }) => {
    const conventionRead =
      await uow.conventionQueries.getConventionById(conventionId);

    if (!conventionRead) throw errors.convention.notFound({ conventionId });
    if (isConventionInScope(conventionRead, currentUser)) return conventionRead;
    throw new ForbiddenError(
      `You are not allowed to access convention : ${conventionRead.id}`,
    );
  });
