import { map } from "ramda";
import {
  AgencyDto,
  AgencyOption,
  PrivateListAgenciesRequestDto,
  privateListAgenciesRequestSchema,
} from "shared";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";

export class PrivateListAgencies extends TransactionalUseCase<
  PrivateListAgenciesRequestDto,
  AgencyOption[]
> {
  protected inputSchema = privateListAgenciesRequestSchema;

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  protected async _execute(
    { status }: PrivateListAgenciesRequestDto,
    uow: UnitOfWork,
  ): Promise<AgencyOption[]> {
    return uow.agencyRepository
      .getAgencies({
        filters: { status: status && [status] },
      })
      .then(
        map(
          ({ id, name, kind }: AgencyDto): AgencyOption => ({ id, name, kind }),
        ),
      );
  }
}
