import { z } from "zod";
import { ApiConsumer, ConventionReadDto } from "shared";
import { ForbiddenError } from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

const MAX_CONVENTIONS_RETURNED = 100;

export class GetConventionsForApiConsumer extends TransactionalUseCase<
  void,
  ConventionReadDto[],
  ApiConsumer
> {
  protected inputSchema = z.void();

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  protected async _execute(
    _input: void,
    uow: UnitOfWork,
    apiConsumer?: ApiConsumer,
  ): Promise<ConventionReadDto[]> {
    if (!apiConsumer) throw new ForbiddenError("No api consumer provided");

    return uow.conventionQueries.getConventionsByScope({
      scope: apiConsumer.rights.convention.scope,
      limit: MAX_CONVENTIONS_RETURNED,
    });
  }
}
