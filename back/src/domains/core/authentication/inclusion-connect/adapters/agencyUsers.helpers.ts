import { sql } from "kysely";
import {
  AgencyDto,
  AgencyId,
  AgencyRole,
  Email,
  OmitFromExistingKeys,
  UserId,
  pipeWithValue,
} from "shared";
import { KyselyDb } from "../../../../../config/pg/kysely/kyselyUtils";

export type UserWithAgencyRole = {
  userId: UserId;
  email: Email;
  agencyId: AgencyId;
  roles: AgencyRole[];
  isNotifiedByEmail: boolean;
};

export type AgencyWithoutEmails = OmitFromExistingKeys<
  AgencyDto,
  "validatorEmails" | "counsellorEmails"
>;

export const usersAgenciesRolesInclude = (agencyRole: AgencyRole) =>
  sql<any>`jsonb_path_exists(roles, '$ ? (@ == "${agencyRole}")')`;

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

  return pipeWithValue(
    transaction
      .selectFrom("users__agencies")
      .innerJoin("users", "users.id", "users__agencies.user_id")
      .where("agency_id", "in", agencyIds)
      .orderBy("users.email")
      .select([
        "users.id as userId",
        "users.email",
        sql<AgencyRole[]>`users__agencies.roles`.as("roles"),
        "users__agencies.agency_id as agencyId",
        "users__agencies.is_notified_by_email as isNotifiedByEmail",
      ]),
    (builder) => {
      if (isNotifiedByEmail !== undefined)
        return builder.where("is_notified_by_email", "=", isNotifiedByEmail);
      return builder;
    },
    (builder) => builder.execute(),
  );
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
      (user) =>
        user.agencyId === agencyIdToMatch && user.roles.includes(roleToMatch),
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
