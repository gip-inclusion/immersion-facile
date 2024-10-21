import { toPairs } from "ramda";
import { AgencyDto, AgencyRight, UserId, errors } from "shared";
import {
  AgencyUsersRights,
  AgencyWithUsersRights,
} from "../domains/agency/ports/AgencyRepository";
import { makeProvider } from "../domains/core/authentication/inclusion-connect/port/OAuthGateway";
import { UnitOfWork } from "../domains/core/unit-of-work/ports/UnitOfWork";

export const toAgencyWithRights = (
  { counsellorEmails, validatorEmails, ...rest }: AgencyDto,
  usersRights?: AgencyUsersRights,
): AgencyWithUsersRights => ({
  ...rest,
  usersRights: {
    ...counsellorEmails.reduce<AgencyUsersRights>(
      (acc, _, index) => ({
        ...acc,
        [`counsellor${index}`]: {
          isNotifiedByEmail: true,
          roles: ["counsellor"],
        },
      }),
      {},
    ),
    ...validatorEmails.reduce<AgencyUsersRights>(
      (acc, _, index) => ({
        ...acc,
        [`validator${index}`]: {
          isNotifiedByEmail: true,
          roles: ["validator"],
        },
      }),
      {},
    ),
    ...usersRights,
  },
});

export const agencyWithRightToAgencyDto = async (
  uow: UnitOfWork,
  { usersRights, ...rest }: AgencyWithUsersRights,
): Promise<AgencyDto> => {
  const provider = await makeProvider(uow);

  const { counsellorIds, validatorIds } = toPairs(usersRights).reduce<{
    counsellorIds: UserId[];
    validatorIds: UserId[];
  }>(
    (acc, item) => {
      const [userId, userRights] = item;

      return {
        counsellorIds: [
          ...acc.counsellorIds,
          ...(userRights.roles.includes("counsellor") ? [userId] : []),
        ],
        validatorIds: [
          ...acc.validatorIds,
          ...(userRights.roles.includes("validator") ? [userId] : []),
        ],
      };
    },
    { counsellorIds: [], validatorIds: [] },
  );

  const counsellors = await uow.userRepository.getByIds(
    counsellorIds,
    provider,
  );

  const validators = await uow.userRepository.getByIds(validatorIds, provider);

  return {
    ...rest,
    counsellorEmails: counsellors.map(({ email }) => email),
    validatorEmails: validators.map(({ email }) => email),
  };
};

export const getAgencyRightByUserId = async (
  uow: UnitOfWork,
  userId: UserId,
): Promise<AgencyRight[]> => {
  const agenciesRightsForUser =
    await uow.agencyRepository.getAgenciesRightsByUserId(userId);

  return Promise.all(
    agenciesRightsForUser.map(async ({ isNotifiedByEmail, roles, agency }) => ({
      isNotifiedByEmail,
      roles,
      agency: await agencyWithRightToAgencyDto(uow, agency),
    })),
  );
};

export const updateRightsOnMultipleAgenciesForUser = async (
  uow: UnitOfWork,
  userId: UserId,
  agenciesRightForUser: AgencyRight[],
): Promise<void> => {
  await Promise.all(
    agenciesRightForUser.map(
      async ({ agency: { id }, isNotifiedByEmail, roles }) => {
        const agency = await uow.agencyRepository.getById(id);
        if (!agency) throw errors.agency.notFound({ agencyId: id });
        return uow.agencyRepository.update({
          id: agency.id,
          usersRights: {
            ...agency.usersRights,
            [userId]: { isNotifiedByEmail, roles },
          },
        });
      },
    ),
  );
};
