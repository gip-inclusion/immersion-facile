import {
  InclusionConnectDomainJwtPayload,
  InclusionConnectedUser,
  UserId,
  errorMessages,
} from "shared";
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
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

export const throwIfNotAdmin = (user: InclusionConnectedUser | undefined) => {
  if (!user) throw new UnauthorizedError();
  if (!user.isBackofficeAdmin)
    throw new ForbiddenError(errorMessages.user.forbidden({ userId: user.id }));
};
