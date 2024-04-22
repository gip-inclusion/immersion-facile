import {
  InclusionConnectDomainJwtPayload,
  InclusionConnectedUser,
  UserId,
} from "shared";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../config/helpers/httpErrors";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

export const throwIfIcUserNotBackofficeAdmin = async (
  uow: UnitOfWork,
  jwtPayload: InclusionConnectDomainJwtPayload,
) => {
  const user = await getIcUserOrThrow(uow, jwtPayload.userId);
  if (!user.isBackofficeAdmin)
    throw new ForbiddenError(
      `User '${jwtPayload.userId}' is not a backOffice user`,
    );
};

export const getIcUserOrThrow = async (
  uow: UnitOfWork,
  userId: UserId,
): Promise<InclusionConnectedUser> => {
  const user = await uow.inclusionConnectedUserRepository.getById(userId);
  if (!user) throw new NotFoundError(`User '${userId}' not found`);
  return user;
};
