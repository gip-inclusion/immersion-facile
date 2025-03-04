import { toPairs } from "ramda";
import {
  AgencyDto,
  AgencyRight,
  AgencyRole,
  AgencyUsersRights,
  AgencyWithUsersRights,
  Email,
  UserId,
  errors,
  toAgencyDtoForAgencyUsersAndAdmins,
} from "shared";
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
  const { counsellorIds, validatorIds } = toPairs(usersRights).reduce<{
    counsellorIds: UserId[];
    validatorIds: UserId[];
  }>(
    (acc, item) => {
      const [userId, userRights] = item;

      return {
        counsellorIds: [
          ...acc.counsellorIds,
          ...(userRights?.roles.includes("counsellor") &&
          userRights?.isNotifiedByEmail
            ? [userId]
            : []),
        ],
        validatorIds: [
          ...acc.validatorIds,
          ...(userRights?.roles.includes("validator") &&
          userRights?.isNotifiedByEmail
            ? [userId]
            : []),
        ],
      };
    },
    { counsellorIds: [], validatorIds: [] },
  );

  const counsellors = await uow.userRepository.getByIds(counsellorIds);

  const validators = await uow.userRepository.getByIds(validatorIds);

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
    agenciesRightsForUser.map<Promise<AgencyRight>>(
      async ({ isNotifiedByEmail, roles, agencyId }) => {
        const agency = await uow.agencyRepository.getById(agencyId);
        if (!agency) throw errors.agency.notFound({ agencyId });
        return {
          isNotifiedByEmail,
          roles,
          agency: toAgencyDtoForAgencyUsersAndAdmins(
            agency,
            await getAgencyEmailsByRole({
              agency,
              role: "agency-admin",
              uow,
            }),
          ),
        };
      },
    ),
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

export const getAgencyEmailsByRole = async ({
  agency,
  role,
  uow,
}: {
  agency: AgencyWithUsersRights;
  role: AgencyRole;
  uow: UnitOfWork;
}): Promise<Email[]> => {
  const adminUserIds = toPairs(agency.usersRights)
    .filter(([_, rights]) => rights?.roles.includes(role))
    .map(([id]) => id);

  const users = await uow.userRepository.getByIds(adminUserIds);
  return users.map((user) => user.email);
};
