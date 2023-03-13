import {
  ConventionReadDto,
  WithConventionId,
  withConventionIdSchema,
} from "shared";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class GetConvention extends TransactionalUseCase<
  WithConventionId,
  ConventionReadDto
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = withConventionIdSchema;

  public async _execute(
    { id }: WithConventionId,
    uow: UnitOfWork,
  ): Promise<ConventionReadDto> {
    const convention = await uow.conventionQueries.getConventionById(id);
    if (
      !convention
      //|| convention.status === "CANCELLED"
    )
      throw new NotFoundError(id);
    return convention;
  }
}
