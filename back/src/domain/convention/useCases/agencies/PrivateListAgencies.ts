import { map } from "ramda";
import {
  AgencyDto,
  AgencyOption,
  PrivateListAgenciesRequestDto,
  privateListAgenciesRequestSchema,
} from "shared";
import { TransactionalUseCase } from "../../../core/UseCase";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";

export class PrivateListAgencies extends TransactionalUseCase<
  PrivateListAgenciesRequestDto,
  AgencyOption[]
> {
  protected inputSchema = privateListAgenciesRequestSchema;

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
