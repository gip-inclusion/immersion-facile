import { type EstablishmentFormUserRights, errors } from "shared";
import type { UserOnRepository } from "../../core/authentication/inclusion-connect/port/UserRepository";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type {
  EstablishmentAdminRight,
  EstablishmentAggregate,
} from "../entities/EstablishmentAggregate";

export const establishmentFormUserRightsFromEstablishmentAggregateAndUsers =
  async (
    uow: UnitOfWork,
    establishmentAggregate: EstablishmentAggregate,
  ): Promise<EstablishmentFormUserRights> => {
    const firstAdminRight = establishmentAggregate.userRights.find(
      (right): right is EstablishmentAdminRight =>
        right.role === "establishment-admin",
    );
    if (!firstAdminRight)
      throw errors.establishment.adminNotFound({
        siret: establishmentAggregate.establishment.siret,
      });
    const firstAdmin = await uow.userRepository.getById(firstAdminRight.userId);
    if (!firstAdmin)
      throw errors.establishment.adminNotFound({
        siret: establishmentAggregate.establishment.siret,
      });

    const establishmentUsers = await uow.userRepository.getByIds(
      establishmentAggregate.userRights.map(({ userId }) => userId),
    );

    return establishmentAggregate.userRights.map(
      ({ role, userId, job, phone }) => {
        const user = establishmentUsers.find((user) => user.id === userId);
        if (!user) throw errors.user.notFound({ userId });
        return role === "establishment-admin"
          ? {
              role,
              email: user.email,
              job,
              phone,
            }
          : {
              role,
              email: user.email,
              job,
              phone,
            };
      },
    );
  };

export const getDiscussionContactsFromAggregate = async (
  uow: UnitOfWork,
  establishment: EstablishmentAggregate,
): Promise<{
  otherUsers: UserOnRepository[];
  firstAdminUser: UserOnRepository;
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
