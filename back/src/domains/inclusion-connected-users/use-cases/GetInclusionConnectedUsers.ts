import {
  InclusionConnectedUser,
  WithAgencyRole,
  withAgencyRoleSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { throwIfNotAdmin } from "../helpers/throwIfIcUserNotBackofficeAdmin";

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
