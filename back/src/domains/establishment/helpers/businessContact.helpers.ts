import { errors, type UserWithAdminRights } from "shared";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type {
  EstablishmentAdminRight,
  EstablishmentAggregate,
} from "../entities/EstablishmentAggregate";

export const getDiscussionContactsFromAggregate = async (
  uow: UnitOfWork,
  establishment: EstablishmentAggregate,
): Promise<{
  otherUsers: UserWithAdminRights[];
  firstAdminUser: UserWithAdminRights;
  firstAdminRight: EstablishmentAdminRight;
}> => {
  const firstAdminRight = establishment.userRights.find(
    (right) => right.role === "establishment-admin",
  );
  if (!firstAdminRight)
    throw errors.establishment.adminNotFound({
      siret: establishment.establishment.siret,
    });

  const firstAdminUser = await uow.userRepository.getById(
    firstAdminRight.userId,
  );
  if (!firstAdminUser)
    throw errors.user.notFound({ userId: firstAdminRight.userId });
  const otherUsers = await uow.userRepository.getByIds(
    establishment.userRights
      .map(({ userId }) => userId)
      .filter((id) => id !== firstAdminUser.id),
  );
  return { otherUsers, firstAdminRight, firstAdminUser };
};
