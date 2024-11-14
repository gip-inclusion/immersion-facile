import { map } from "ramda";
import {
  AgencyOption,
  PrivateListAgenciesRequestDto,
  privateListAgenciesRequestSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

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
          ({ id, name, kind, status }): AgencyOption => ({
            id,
            name,
            kind,
            status,
          }),
        ),
      );
  }
}
