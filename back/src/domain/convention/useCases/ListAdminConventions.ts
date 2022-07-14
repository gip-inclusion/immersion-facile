import {
  ConventionReadDto,
  ListConventionsRequestDto as ListConventionsForAdminRequestDto,
} from "shared/src/convention/convention.dto";
import { listConventionsRequestSchema } from "shared/src/convention/convention.schema";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class ListAdminConventions extends TransactionalUseCase<
  ListConventionsForAdminRequestDto,
  ConventionReadDto[]
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = listConventionsRequestSchema;

  public async _execute(
    { status, agencyId }: ListConventionsForAdminRequestDto,
    uow: UnitOfWork,
  ) {
    const entities = await uow.conventionQueries.getLatestConventions({
      status,
      agencyId,
    });
    return entities;
  }
}
