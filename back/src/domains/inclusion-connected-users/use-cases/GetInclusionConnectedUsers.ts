import {
  InclusionConnectDomainJwtPayload,
  InclusionConnectedUser,
  WithAgencyRole,
  withAgencyRoleSchema,
} from "shared";
import { ForbiddenError } from "../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { throwIfIcUserNotBackofficeAdmin } from "../helpers/throwIfIcUserNotBackofficeAdmin";

export class GetInclusionConnectedUsers extends TransactionalUseCase<
  WithAgencyRole,
  InclusionConnectedUser[],
  InclusionConnectDomainJwtPayload
> {
  protected inputSchema = withAgencyRoleSchema;

  protected async _execute(
    { agencyRole }: WithAgencyRole,
    uow: UnitOfWork,
    jwtPayload?: InclusionConnectDomainJwtPayload,
  ): Promise<InclusionConnectedUser[]> {
    if (!jwtPayload) throw new ForbiddenError("No JWT token provided");

    await throwIfIcUserNotBackofficeAdmin(uow, jwtPayload);

    return uow.inclusionConnectedUserRepository.getWithFilter({ agencyRole });
  }
}
