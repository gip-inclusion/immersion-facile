import { InclusionConnectDomainJwtPayload, errors } from "shared";
import { UserOnRepository } from "../../core/authentication/inclusion-connect/port/UserRepository";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { getIcUserByUserId } from "./inclusionConnectedUser.helper";

export const throwIfIcUserNotBackofficeAdmin = async (
  uow: UnitOfWork,
  jwtPayload: InclusionConnectDomainJwtPayload,
) => {
  const user = await getIcUserByUserId(uow, jwtPayload.userId);
  if (!user.isBackofficeAdmin)
    throw errors.user.notBackOfficeAdmin({ userId: jwtPayload.userId });
};

export const throwIfNotAdmin = (user: UserOnRepository | undefined) => {
  if (!user) throw errors.user.unauthorized();
  if (!user.isBackofficeAdmin) throw errors.user.forbidden({ userId: user.id });
};
