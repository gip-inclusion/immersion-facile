import {
  AgencyDto,
  OAuthGatewayProvider,
  UserId,
  UserParamsForAgency,
  errors,
} from "shared";
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

export const throwIfThereAreNoOtherCounsellorReceivingNotifications = async (
  uow: UnitOfWork,
  params: UserParamsForAgency,
  agency: AgencyDto,
  provider: OAuthGatewayProvider,
) => {
  const otherCounsellorsReceivingNotifications = agency.counsellorEmails.filter(
    (email) => email !== params.email,
  );

  if (params.roles.includes("counsellor")) {
    if (otherCounsellorsReceivingNotifications.length > 0) return;
    if (params.isNotifiedByEmail) return;
    throw errors.agency.notEnoughCounsellors({ agencyId: agency.id });
  }

  const agencyUsers = await uow.userRepository.getIcUsersWithFilter(
    { agencyId: agency.id },
    provider,
  );

  const counsellorNotReceivingNotifications = agencyUsers.filter(
    ({ agencyRights }) => {
      const right = agencyRights.find((right) => right.agency.id === agency.id);
      if (!right) throw new Error("this is not suppose to happen");
      return right.roles.includes("counsellor") && !right.isNotifiedByEmail;
    },
  );

  if (counsellorNotReceivingNotifications.length === 0) return;

  if (otherCounsellorsReceivingNotifications.length === 0)
    throw errors.agency.notEnoughCounsellors({ agencyId: agency.id });
};
