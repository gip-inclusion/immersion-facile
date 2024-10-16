import { toPairs } from "ramda";
import { AgencyRole, UserId, errors } from "shared";
import { AgencyWithUsersRights } from "../../agency/ports/AgencyRepository";

export const throwIfAgencyDontHaveOtherValidatorsReceivingNotifications = (
  agency: AgencyWithUsersRights,
  userId: UserId,
): void => {
  if (
    agency.refersToAgencyId === null &&
    !hasOtherNotifiedUserWithRole(agency, userId, "validator")
  )
    throw errors.agency.notEnoughValidators({ agencyId: agency.id });
};

export const throwIfAgencyDontHaveOtherCounsellorsReceivingNotifications = (
  agency: AgencyWithUsersRights,
  userId: UserId,
): void => {
  if (
    agency.refersToAgencyId &&
    !hasOtherNotifiedUserWithRole(agency, userId, "counsellor")
  )
    throw errors.agency.notEnoughCounsellors({ agencyId: agency.id });
};

const hasOtherNotifiedUserWithRole = (
  agency: AgencyWithUsersRights,
  userId: UserId,
  role: AgencyRole,
): boolean =>
  toPairs(agency.usersRights).some(
    ([id, { roles, isNotifiedByEmail }]) =>
      id !== userId && isNotifiedByEmail && roles.includes(role),
  );
