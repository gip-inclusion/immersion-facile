import { onlyAdminUserRightsWithStatusAccepted, type UserId } from "shared";
import type { EstablishmentAggregate } from "../entities/EstablishmentAggregate";

export const isEstablishmentReachableByPhoneAfter15Days = (
  establishmentAggregate: EstablishmentAggregate,
): boolean =>
  establishmentAggregate.establishment.contactMode === "EMAIL" &&
  !!establishmentAggregate.userRights.find(
    (right) => right.isMainContactByPhone,
  )?.phone;

export const isLastAcceptedAdminWithOnlyPendingRemainingRights = (
  { userRights }: EstablishmentAggregate,
  userId: UserId,
): boolean => {
  const acceptedAdmins = userRights.filter(
    onlyAdminUserRightsWithStatusAccepted,
  );
  const remainingRights = userRights.filter((right) => right.userId !== userId);
  const isUserTheOnlyAcceptedAdmin =
    acceptedAdmins.length === 1 && acceptedAdmins[0]?.userId === userId;
  const remainingRightsAreAllPending =
    remainingRights.length > 0 &&
    remainingRights.every(({ status }) => status === "PENDING");

  return isUserTheOnlyAcceptedAdmin && remainingRightsAreAllPending;
};
