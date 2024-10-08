import { AgencyDto, OAuthGatewayProvider, UserId, errors } from "shared";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

export const throwIfAgencyDontHaveOtherValidatorsReceivingNotifications =
  async (
    uow: UnitOfWork,
    agency: AgencyDto,
    userId: UserId,
    provider: OAuthGatewayProvider,
  ) => {
    if (agency.refersToAgencyId !== null) return;

    const agencyUsers = await uow.userRepository.getIcUsersWithFilter(
      {
        agencyId: agency.id,
      },
      provider,
    );

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
  async (
    uow: UnitOfWork,
    agency: AgencyDto,
    userId: UserId,
    provider: OAuthGatewayProvider,
  ) => {
    if (!agency.refersToAgencyId) return;

    const agencyUsers = await uow.userRepository.getIcUsersWithFilter(
      {
        agencyId: agency.id,
      },
      provider,
    );

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
