import { InclusionConnectDomainJwtPayload } from "shared";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../config/helpers/httpErrors";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

export const throwIfIcUserNotBackofficeAdmin = async (
  uow: UnitOfWork,
  jwtPayload: InclusionConnectDomainJwtPayload,
) => {
  const user = await uow.inclusionConnectedUserRepository.getById(
    jwtPayload.userId,
  );

  if (!user) throw new NotFoundError(`User '${jwtPayload.userId}' not found`);
  if (!user.isBackofficeAdmin)
    throw new ForbiddenError(
      `User '${jwtPayload.userId}' is not a backOffice user`,
    );
};
