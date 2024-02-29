import {
  ApiConsumer,
  ConventionReadDto,
  WithConventionId,
  withConventionIdSchema,
} from "shared";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { isConventionInScope } from "../entities/Convention";

export class GetConventionForApiConsumer extends TransactionalUseCase<
  WithConventionId,
  ConventionReadDto,
  ApiConsumer
> {
  protected inputSchema = withConventionIdSchema;

  protected async _execute(
    { conventionId }: WithConventionId,
    uow: UnitOfWork,
    apiConsumer?: ApiConsumer,
  ): Promise<ConventionReadDto> {
    if (!apiConsumer) throw new ForbiddenError("No api consumer provided");

    const conventionRead =
      await uow.conventionQueries.getConventionById(conventionId);

    if (!conventionRead) throw noConventionFound(conventionId);
    if (isConventionInScope(conventionRead, apiConsumer)) return conventionRead;
    throw new ForbiddenError(
      `You are not allowed to access convention : ${conventionRead.id}`,
    );
  }
}

const noConventionFound = (conventionId: string) =>
  new NotFoundError(`No convention found with id ${conventionId}`);
