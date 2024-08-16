import {
  InclusionConnectDomainJwtPayload,
  InclusionConnectedUser,
  UserId,
  errors,
} from "shared";

import { oAuthModeByFeatureFlags } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

export const throwIfIcUserNotBackofficeAdmin = async (
  uow: UnitOfWork,
  jwtPayload: InclusionConnectDomainJwtPayload,
) => {
  const user = await getIcUserOrThrow(uow, jwtPayload.userId);
  if (!user.isBackofficeAdmin)
    throw errors.user.notBackOfficeAdmin({ userId: jwtPayload.userId });
};

export const getIcUserOrThrow = async (
  uow: UnitOfWork,
  userId: UserId,
): Promise<InclusionConnectedUser> => {
  const user = await uow.userRepository.getById(
    userId,
    oAuthModeByFeatureFlags(await uow.featureFlagRepository.getAll()),
  );
  if (!user) throw errors.user.notFound({ userId });
  return user;
};

export const throwIfNotAdmin = (user: InclusionConnectedUser | undefined) => {
  if (!user) throw errors.user.unauthorized();
  if (!user.isBackofficeAdmin) throw errors.user.forbidden({ userId: user.id });
};
