import { toPairs } from "ramda";
import {
  type AgencyRole,
  type AgencyUsersRights,
  type AgencyWithUsersRights,
  ConflictError,
  type UserId,
} from "shared";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

export const throwConflictErrorOnSimilarAgencyFound = async ({
  uow,
  agency,
}: {
  uow: UnitOfWork;
  agency: AgencyWithUsersRights;
}) => {
  const hasSimilarAgency =
    await uow.agencyRepository.alreadyHasActiveAgencyWithSameAddressAndKind({
      address: agency.address,
      kind: agency.kind,
      idToIgnore: agency.id,
    });

  if (hasSimilarAgency)
    throw new ConflictError(
      "Une autre agence du même type existe avec la même adresse",
    );
};

export const getUserIdsWithoutRoleFromAgencyRights = ({
  rights,
  excludedRole,
}: {
  rights: AgencyUsersRights;
  excludedRole: AgencyRole;
}): UserId[] =>
  toPairs(rights).reduce<UserId[]>(
    (acc, [userId, right]) => [
      ...acc,
      ...(right?.roles.includes(excludedRole) ? [] : [userId]),
    ],
    [],
  );
