import { AgencyId, AgencyRefersToInConvention } from "shared";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork } from "../../core/ports/UnitOfWork";

export const getReferedAgency = async (
  uow: UnitOfWork,
  agencyId: AgencyId,
): Promise<AgencyRefersToInConvention> => {
  const referedAgency = await uow.agencyRepository.getById(agencyId);
  if (referedAgency) return { id: referedAgency.id, name: referedAgency.name };
  throw new NotFoundError(
    `Refered agency ${agencyId} missing on agency repository.`,
  );
};
