import { map } from "ramda";
import {
  type AgencyOption,
  type PrivateListAgenciesRequestDto,
  privateListAgenciesRequestSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

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
          ({
            id,
            name,
            kind,
            status,
            address,
            refersToAgencyName,
          }): AgencyOption => ({
            id,
            name,
            kind,
            status,
            address,
            refersToAgencyName,
          }),
        ),
      );
  }
}
