import type {
  AgencyDto,
  AgencyId,
  AgencyRole,
  Email,
  OmitFromExistingKeys,
  UserId,
} from "shared";
import { KyselyDb } from "../../../../../config/pg/kysely/kyselyUtils";

export type UserWithAgencyRole = {
  userId: UserId;
  email: Email;
  agencyId: AgencyId;
  role: AgencyRole;
  isNotifiedByEmail: boolean;
};

export type AgencyWithoutEmails = OmitFromExistingKeys<
  AgencyDto,
  "validatorEmails" | "counsellorEmails"
>;

export const getUsersWithAgencyRole = async (
  transaction: KyselyDb,
  {
    agencyIds,
    isNotifiedByEmail,
  }: {
    agencyIds: AgencyId[];
    isNotifiedByEmail?: boolean;
  },
): Promise<UserWithAgencyRole[]> => {
  if (agencyIds.length === 0) return [];
  let builder = transaction
    .selectFrom("users__agencies")
    .innerJoin("users", "users.id", "users__agencies.user_id")
    .where("agency_id", "in", agencyIds)
    .where((eb) =>
      eb.or([eb("role", "=", "validator"), eb("role", "=", "counsellor")]),
    );

  if (isNotifiedByEmail !== undefined) {
    builder = builder.where("is_notified_by_email", "=", isNotifiedByEmail);
  }

  return builder
    .orderBy("users.email")
    .select([
      "users.id as userId",
      "users.email",
      "users__agencies.role",
      "users__agencies.agency_id as agencyId",
      "users__agencies.is_notified_by_email as isNotifiedByEmail",
    ])
    .execute();
};

type AgencyMatchingCriteria = {
  agencyIdToMatch: AgencyId;
  roleToMatch: AgencyRole;
};

export const getEmailsFromUsersWithAgencyRoles = (
  usersWithAgencyRole: UserWithAgencyRole[],
  { agencyIdToMatch, roleToMatch }: AgencyMatchingCriteria,
) => {
  return usersWithAgencyRole
    .filter(
      (user) => user.agencyId === agencyIdToMatch && user.role === roleToMatch,
    )
    .map((user) => user.email);
};

export const addEmailsToAgency =
  (usersWithAgencyRole: UserWithAgencyRole[]) =>
  (agency: AgencyWithoutEmails) => {
    return {
      ...agency,
      validatorEmails: getEmailsFromUsersWithAgencyRoles(usersWithAgencyRole, {
        agencyIdToMatch: agency.id,
        roleToMatch: "validator",
      }),
      counsellorEmails: getEmailsFromUsersWithAgencyRoles(usersWithAgencyRole, {
        agencyIdToMatch: agency.id,
        roleToMatch: "counsellor",
      }),
    };
  };
