import {
  InclusionConnectDomainJwtPayload,
  InclusionConnectedUser,
  UserId,
  errors,
} from "shared";
import { ForbiddenError, NotFoundError } from "shared";
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
  if (!user) throw errors.user.unauthorized();
  if (!user.isBackofficeAdmin) throw errors.user.forbidden({ userId: user.id });
};
