import { AgencyDto } from "shared";
import {
  AgencyUsersRights,
  AgencyWithUsersRights,
} from "../domains/agency/ports/AgencyRepository";

export const toAgencyWithRights = (
  { counsellorEmails, validatorEmails, ...rest }: AgencyDto,
  usersRights: AgencyUsersRights,
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
