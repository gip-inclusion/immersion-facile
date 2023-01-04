import {
  AgencyDto,
  AgencyOption,
  PrivateListAgenciesRequestDto,
  privateListAgenciesRequestSchema,
} from "shared";
import {
  UnitOfWorkPerformer,
  UnitOfWork,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import { map } from "ramda";

export class PrivateListAgencies extends TransactionalUseCase<
  PrivateListAgenciesRequestDto,
  AgencyOption[]
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = privateListAgenciesRequestSchema;

  public async _execute(
    { status }: PrivateListAgenciesRequestDto,
    uow: UnitOfWork,
  ): Promise<AgencyOption[]> {
    return uow.agencyRepository
      .getAgencies({
        filters: { status: status && [status] },
      })
      .then(map(({ id, name }: AgencyDto): AgencyOption => ({ id, name })));
  }
}
