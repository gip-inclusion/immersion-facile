import {
  InclusionConnectedUser,
  WithAgencyRole,
  withAgencyRoleSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { throwIfNotAdmin } from "../../core/authentication/inclusion-connect/helpers/ic-user.helpers";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

export class GetInclusionConnectedUsers extends TransactionalUseCase<
  WithAgencyRole,
  InclusionConnectedUser[],
  InclusionConnectedUser
> {
  protected inputSchema = withAgencyRoleSchema;

  protected async _execute(
    { agencyRole }: WithAgencyRole,
    uow: UnitOfWork,
    currentUser?: InclusionConnectedUser,
  ): Promise<InclusionConnectedUser[]> {
    throwIfNotAdmin(currentUser);
    return uow.inclusionConnectedUserRepository.getWithFilter({ agencyRole });
  }
}
