import {
  errors,
  type UserEstablishmentRightDetails,
  type UserEstablishmentRightDetailsWithAcceptedStatus,
  type UserEstablishmentRightDetailsWithPendingStatus,
  type UserId,
  type UserWithAdminRights,
  type UserWithRights,
  type WithBannedEstablishmentInformations,
  type WithUserEstablishmentRightDetails,
} from "shared";
import { match } from "ts-pattern";
import { getAgencyRightByUserId } from "../../../utils/agency";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { EstablishmentAggregate } from "../../establishment/entities/EstablishmentAggregate";
import type { EstablishmentEntity } from "../../establishment/entities/EstablishmentEntity";

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
): Promise<WithUserEstablishmentRightDetails> => {
  const establishmentAggregates =
    await uow.establishmentAggregateRepository.getEstablishmentAggregatesByFilters(
      {
        userId: user.id,
      },
    );
  const establishments: UserEstablishmentRightDetails[] = await Promise.all(
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
): Promise<UserEstablishmentRightDetails> => {
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

  return match(userRight)
    .with({ status: "PENDING" }, (pendingUserRight) => {
      const userRightDetailsWithPendingStatus = {
        siret: establishment.siret,
        businessName: establishment.customizedName
          ? establishment.customizedName
          : establishment.name,
        role: userRight.role,
        status: pendingUserRight.status,
      } satisfies UserEstablishmentRightDetailsWithPendingStatus;

      return {
        ...userRightDetailsWithPendingStatus,
        ...makeWithBanEstablishmentInformations(establishment),
      };
    })
    .with({ status: "ACCEPTED" }, (acceptedUserRight) => {
      const userRightDetailsWithAcceptedStatus = {
        siret: establishment.siret,
        businessName: establishment.customizedName
          ? establishment.customizedName
          : establishment.name,
        role: userRight.role,
        status: acceptedUserRight.status,
        admins: adminUsers.map(({ firstName, lastName, email }) => ({
          firstName,
          lastName,
          email,
        })),
      } satisfies UserEstablishmentRightDetailsWithAcceptedStatus;

      return {
        ...userRightDetailsWithAcceptedStatus,
        ...makeWithBanEstablishmentInformations(establishment),
      } satisfies UserEstablishmentRightDetails;
    })
    .exhaustive();
};

const makeWithBanEstablishmentInformations = (
  establishment: EstablishmentEntity,
): WithBannedEstablishmentInformations =>
  establishment.isEstablishmentBanned
    ? {
        isEstablishmentBanned: establishment.isEstablishmentBanned,
        establishmentBannishmentJustification:
          establishment.establishmentBannishmentJustification,
      }
    : { isEstablishmentBanned: establishment.isEstablishmentBanned };
