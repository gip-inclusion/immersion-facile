import {
  type EstablishmentData,
  errors,
  type UserId,
  type UserWithAdminRights,
  type UserWithRights,
  type WithEstablishmentsData,
} from "shared";
import { getAgencyRightByUserId } from "../../../utils/agency";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { EstablishmentAggregate } from "../../establishment/entities/EstablishmentAggregate";

export const getUserWithRights = async (
  uow: UnitOfWork,
  userId: UserId,
): Promise<UserWithRights> => {
  const user = await uow.userRepository.getById(userId);
  if (!user) throw errors.user.notFound({ userId });
  const agencyRights = await getAgencyRightByUserId(uow, user.id);

  return {
    ...user,
    agencyRights,
    ...(await withEstablishments(uow, user)),
  };
};

const withEstablishments = async (
  uow: UnitOfWork,
  user: UserWithAdminRights,
): Promise<WithEstablishmentsData> => {
  const establishmentAggregates =
    await uow.establishmentAggregateRepository.getEstablishmentAggregatesByFilters(
      {
        userId: user.id,
      },
    );
  const establishments: EstablishmentData[] = await Promise.all(
    establishmentAggregates.map((establishment) =>
      makeEstablishmentRights(uow, establishment, user.id),
    ),
  );
  return establishments.length ? { establishments } : {};
};

const makeEstablishmentRights = async (
  uow: UnitOfWork,
  { establishment, userRights }: EstablishmentAggregate,
  userId: UserId,
) => {
  const userRight = userRights.find((userRight) => userRight.userId === userId);
  if (!userRight) {
    throw errors.establishment.noUserRights({
      siret: establishment.siret,
    });
  }

  const adminUsers = await uow.userRepository.getByIds(
    userRights
      .filter((user) => user.role === "establishment-admin")
      .map(({ userId }) => userId),
  );

  return {
    siret: establishment.siret,
    businessName: establishment.customizedName
      ? establishment.customizedName
      : establishment.name,
    role: userRight.role,
    admins: adminUsers.map(({ firstName, lastName, email }) => ({
      firstName,
      lastName,
      email,
    })),
  };
};
