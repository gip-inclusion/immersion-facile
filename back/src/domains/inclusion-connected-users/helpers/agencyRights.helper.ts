import { values } from "ramda";
import {
  AgencyId,
  AgencyRole,
  AgencyUsersRights,
  AgencyWithUsersRights,
  errors,
} from "shared";

export const rejectIfEditionOfValidatorsOfAgencyWithRefersTo = (
  agency: AgencyWithUsersRights,
  roles: AgencyRole[],
) => {
  if (agency.refersToAgencyId && roles.includes("validator")) {
    throw errors.agency.invalidValidatorEditionWhenAgencyWithRefersTo(
      agency.id,
    );
  }
};

export const rejectIfEditionOfRolesWhenNotBackofficeAdminNorAgencyAdmin = (
  initialRoles: AgencyRole[],
  requestedRole: AgencyRole[],
  isBackofficeAdminNorAgencyAdmin: boolean,
) => {
  const areRolesUpdated =
    initialRoles.sort().join() !== requestedRole.sort().join();

  if (!isBackofficeAdminNorAgencyAdmin && areRolesUpdated)
    throw errors.user.forbiddenRolesUpdate();
};

export const rejectIfEditionOfNotificationPreferencesWhenNotAdminNorOwnPreferences =
  (
    isOwnPreferences: boolean,
    areNotificationPreferencesUpdated: boolean,
    isBackofficeAdminNorAgencyAdmin: boolean,
  ) => {
    if (
      !isBackofficeAdminNorAgencyAdmin &&
      !isOwnPreferences &&
      areNotificationPreferencesUpdated
    )
      throw errors.user.forbiddenNotificationsPreferencesUpdate();
  };

export function validateAgencyRights(
  agencyId: AgencyId,
  agencyRights: AgencyUsersRights,
) {
  rejectIfAgencyHaveCounsellorsButNoOneNotified(agencyId, agencyRights);
  rejectIfAgencyWontHaveSomeNotifiedValidator(agencyId, agencyRights);
}

const rejectIfAgencyHaveCounsellorsButNoOneNotified = (
  agencyId: AgencyId,
  agencyRights: AgencyUsersRights,
): void => {
  const counsellorRights = values(agencyRights).filter((right) =>
    right?.roles.includes("counsellor"),
  );
  if (
    counsellorRights.length > 0 &&
    !counsellorRights.some((right) => right?.isNotifiedByEmail === true)
  )
    throw errors.agency.notEnoughCounsellors({ agencyId });
};

const rejectIfAgencyWontHaveSomeNotifiedValidator = (
  agencyId: AgencyId,
  agencyRights: AgencyUsersRights,
): void => {
  if (
    !values(agencyRights).some(
      (right) =>
        right?.isNotifiedByEmail === true && right.roles.includes("validator"),
    )
  )
    throw errors.agency.notEnoughValidators({ agencyId });
};
