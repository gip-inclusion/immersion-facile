import { AgencyDto } from "shared";
import { ConflictError } from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork } from "../../core/ports/UnitOfWork";

export const throwConflictErrorOnSimilarAgencyFound = async ({
  uow,
  agency,
}: {
  uow: UnitOfWork;
  agency: AgencyDto;
}) => {
  const hasSimilarAgency =
    await uow.agencyRepository.alreadyHasActiveAgencyWithSameAddressAndKind({
      address: agency.address,
      kind: agency.kind,
      idToIgnore: agency.id,
    });

  if (hasSimilarAgency)
    throw new ConflictError(
      "An other agency exists with the same address and kind",
    );
};
