import { toPairs } from "ramda";
import { AgencyRole, UserId, errors } from "shared";
import { AgencyWithUsersRights } from "../../agency/ports/AgencyRepository";

export const throwIfAgencyDontHaveOtherValidatorsReceivingNotifications = (
  agency: AgencyWithUsersRights,
  userId: UserId,
): void => {
  if (
    agency.refersToAgencyId === null &&
    !hasOtherUserWithRoleAndNotificationMode(agency, userId, "validator", true)
  )
    throw errors.agency.notEnoughValidators({ agencyId: agency.id });
};

export const throwIfAgencyDontHaveOtherCounsellorsReceivingNotifications = (
  agency: AgencyWithUsersRights,
  userId: UserId,
): void => {
  if (
    agency.refersToAgencyId &&
    !hasOtherUserWithRoleAndNotificationMode(agency, userId, "counsellor", true)
  )
    throw errors.agency.notEnoughCounsellors({ agencyId: agency.id });
};

export const throwIfAgencyRefersToAndUserIsValidator = (
  agency: AgencyWithUsersRights,
  userId: UserId,
) => {
  if (
    agency.refersToAgencyId &&
    agency.usersRights[userId]?.roles.includes("validator")
  )
    throw errors.agency.invalidValidatorEditionWhenAgencyWithRefersTo(
      agency.id,
    );
};

const hasOtherUserWithRoleAndNotificationMode = (
  agency: AgencyWithUsersRights,
  userId: UserId,
  role: AgencyRole,
  isNotifiedByEmail: boolean,
): boolean =>
  toPairs(agency.usersRights).some(
    ([id, right]) =>
      id !== userId &&
      right?.isNotifiedByEmail === isNotifiedByEmail &&
      right.roles.includes(role),
  );
