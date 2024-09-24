import { AgencyDto, UserId, errors } from "shared";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

export const throwIfAgencyDontHaveOtherValidatorsReceivingNotifications =
  async (uow: UnitOfWork, agency: AgencyDto, userId: UserId) => {
    if (agency.refersToAgencyId !== null) return;

    const agencyUsers = await uow.userRepository.getWithFilter({
      agencyId: agency.id,
    });

    const agencyHasOtherValidator = agencyUsers.some(
      (agencyUser) =>
        agencyUser.id !== userId &&
        agencyUser.agencyRights.some(
          (right) =>
            right.isNotifiedByEmail && right.roles.includes("validator"),
        ),
    );

    if (!agencyHasOtherValidator)
      throw errors.agency.notEnoughValidators({ agencyId: agency.id });
  };

export const throwIfAgencyDontHaveOtherCounsellorsReceivingNotifications =
  async (uow: UnitOfWork, agency: AgencyDto, userId: UserId) => {
    if (!agency.refersToAgencyId) return;

    const agencyUsers = await uow.userRepository.getWithFilter({
      agencyId: agency.id,
    });

    const agencyHasOtherCounsellor = agencyUsers.some(
      (agencyUser) =>
        agencyUser.id !== userId &&
        agencyUser.agencyRights.some(
          (right) =>
            right.isNotifiedByEmail && right.roles.includes("counsellor"),
        ),
    );

    if (!agencyHasOtherCounsellor)
      throw errors.agency.notEnoughCounsellors({ agencyId: agency.id });
  };
