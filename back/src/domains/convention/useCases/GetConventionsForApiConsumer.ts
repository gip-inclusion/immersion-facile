import { ApiConsumer, ConventionReadDto, conventionStatuses } from "shared";
import { z } from "zod";
import { ForbiddenError } from "../../../adapters/primary/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
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
