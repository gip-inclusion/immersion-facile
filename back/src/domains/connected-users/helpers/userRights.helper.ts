import { uniq } from "ramda";
import {
  type BusinessName,
  type BusinessNameCustomized,
  type EstablishmentAdminPrivateData,
  errors,
  onlyAdminUserRightsWithStatusAccepted,
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
  const adminUsers = await uow.userRepository.getByIds(
    uniq(
      establishmentAggregates.flatMap(({ userRights }) =>
        getAdminUserIds(userRights),
      ),
    ),
  );
  const adminsByUserId = adminUsers.reduce<
    Record<UserId, EstablishmentAdminPrivateData>
  >(
    (acc, { id, firstName, lastName, email }) => ({
      ...acc,
      [id]: { firstName, lastName, email },
    }),
    {},
  );
  const establishments: UserEstablishmentRightDetails[] =
    establishmentAggregates.map((establishmentAggregate) =>
      makeEstablishmentRights(establishmentAggregate, user.id, adminsByUserId),
    );
  return establishments.length ? { establishments } : {};
};

const getAdminUserIds = (
  userRights: EstablishmentAggregate["userRights"],
): UserId[] =>
  userRights
    .filter(onlyAdminUserRightsWithStatusAccepted)
    .map(({ userId }) => userId);

const makeEstablishmentRights = (
  { establishment, userRights }: EstablishmentAggregate,
  userId: UserId,
  adminsByUserId: Record<UserId, EstablishmentAdminPrivateData>,
): UserEstablishmentRightDetails => {
  const userRight = userRights.find((userRight) => userRight.userId === userId);
  if (!userRight) {
    throw errors.establishment.noUserRights({
      siret: establishment.siret,
    });
  }

  return match(userRight)
    .with({ status: "PENDING" }, (pendingUserRight) => {
      const userRightDetailsWithPendingStatus = {
        siret: establishment.siret,
        ...makeBusinessNames(establishment),
        role: userRight.role,
        status: pendingUserRight.status,
        shouldReceiveDiscussionNotifications:
          pendingUserRight.shouldReceiveDiscussionNotifications,
      } satisfies UserEstablishmentRightDetailsWithPendingStatus;

      return {
        ...userRightDetailsWithPendingStatus,
        ...makeWithBanEstablishmentInformations(establishment),
      };
    })
    .with({ status: "ACCEPTED" }, (acceptedUserRight) => {
      const userRightDetailsWithAcceptedStatus = {
        siret: establishment.siret,
        ...makeBusinessNames(establishment),
        role: userRight.role,
        status: acceptedUserRight.status,
        admins: getAdminUserIds(userRights).flatMap((adminUserId) => {
          const admin = adminsByUserId[adminUserId];
          return admin ? [admin] : [];
        }),
        shouldReceiveDiscussionNotifications:
          acceptedUserRight.shouldReceiveDiscussionNotifications,
      } satisfies UserEstablishmentRightDetailsWithAcceptedStatus;

      return {
        ...userRightDetailsWithAcceptedStatus,
        ...makeWithBanEstablishmentInformations(establishment),
      } satisfies UserEstablishmentRightDetails;
    })
    .exhaustive();
};

const makeBusinessNames = (
  establishment: EstablishmentEntity,
): {
  businessName: BusinessName;
  businessNameCustomized?: BusinessNameCustomized;
} => ({
  businessName: establishment.name,
  ...(establishment.customizedName
    ? { businessNameCustomized: establishment.customizedName }
    : {}),
});

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
