import { map } from "ramda";
import {
  type AgencyOption,
  type ConnectedUser,
  errors,
  type PrivateListAgenciesRequestDto,
  privateListAgenciesRequestSchema,
} from "shared";
import { throwIfNotAdmin } from "../../connected-users/helpers/authorization.helper";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

export class PrivateListAgencies extends TransactionalUseCase<
  PrivateListAgenciesRequestDto,
  AgencyOption[],
  ConnectedUser
> {
  protected inputSchema = privateListAgenciesRequestSchema;

  protected async _execute(
    { status }: PrivateListAgenciesRequestDto,
    uow: UnitOfWork,
    currentUser: ConnectedUser,
  ): Promise<AgencyOption[]> {
    if (!currentUser) throw errors.user.unauthorized();
    throwIfNotAdmin(currentUser);
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
