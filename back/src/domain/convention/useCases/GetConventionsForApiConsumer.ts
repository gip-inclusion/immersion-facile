import { z } from "zod";
import { ApiConsumer, ConventionReadDto, conventionStatuses } from "shared";
import { ForbiddenError } from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { GetConventionsByFiltersQueries } from "../ports/ConventionQueries";

const MAX_CONVENTIONS_RETURNED = 100;

export class GetConventionsForApiConsumer extends TransactionalUseCase<
  GetConventionsByFiltersQueries,
  ConventionReadDto[],
  ApiConsumer
> {
  protected inputSchema = z.object({
    startDateGreater: z.date().optional(),
    startDateLessOrEqual: z.date().optional(),
    withStatuses: z.array(z.enum(conventionStatuses)).optional(),
  });

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  protected async _execute(
    filters: GetConventionsByFiltersQueries,
    uow: UnitOfWork,
    apiConsumer?: ApiConsumer,
  ): Promise<ConventionReadDto[]> {
    if (!apiConsumer) throw new ForbiddenError("No api consumer provided");

    return uow.conventionQueries.getConventionsByScope({
      scope: apiConsumer.rights.convention.scope,
      limit: MAX_CONVENTIONS_RETURNED,
      filters,
    });
  }
}
