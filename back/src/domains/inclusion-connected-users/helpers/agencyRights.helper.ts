import { values } from "ramda";
import { AgencyId, UserParamsForAgency, errors } from "shared";
import {
  AgencyUsersRights,
  AgencyWithUsersRights,
} from "../../agency/ports/AgencyRepository";

export const rejectIfEditionOfValidatorsOfAgencyWithRefersTo = (
  params: UserParamsForAgency,
  agency: AgencyWithUsersRights,
) => {
  if (params.roles.includes("validator") && agency.refersToAgencyId) {
    throw errors.agency.invalidValidatorEditionWhenAgencyWithRefersTo(
      agency.id,
    );
  }
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
