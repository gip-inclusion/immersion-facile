import { ConflictError } from "shared";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { AgencyWithUsersRights } from "../ports/AgencyRepository";

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
