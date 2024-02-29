import {
  BackOfficeJwtPayload,
  InclusionConnectedUser,
  WithAgencyRole,
  withAgencyRoleSchema,
} from "shared";
import { ForbiddenError } from "../../../adapters/primary/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

export class GetInclusionConnectedUsers extends TransactionalUseCase<
  WithAgencyRole,
  InclusionConnectedUser[],
  BackOfficeJwtPayload
> {
  protected inputSchema = withAgencyRoleSchema;

  protected async _execute(
    { agencyRole }: WithAgencyRole,
    uow: UnitOfWork,
    jwtPayload?: BackOfficeJwtPayload,
  ): Promise<InclusionConnectedUser[]> {
    if (!jwtPayload) throw new ForbiddenError("No JWT token provided");
    if (jwtPayload.role !== "backOffice")
      throw new ForbiddenError(
        `This user is not a backOffice user, role was : '${jwtPayload?.role}'`,
      );

    return uow.inclusionConnectedUserRepository.getWithFilter({ agencyRole });
  }
}
