import { AgencyId, AgencyRefersToInConvention, errors } from "shared";
import { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";

export const getReferedAgency = async (
  uow: UnitOfWork,
  agencyId: AgencyId,
): Promise<AgencyRefersToInConvention> => {
  const referedAgency = await uow.agencyRepository.getById(agencyId);
  if (referedAgency)
    return {
      id: referedAgency.id,
      name: referedAgency.name,
      kind: referedAgency.kind,
    };
  throw errors.agency.notFound({ agencyId });
};
