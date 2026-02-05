import { type AgencyId, type AgencyRefersToInConvention, errors } from "shared";
import type { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";

export const getReferedAgency = async (
  uow: UnitOfWork,
  agencyId: AgencyId,
): Promise<AgencyRefersToInConvention> => {
  const referedAgency = await uow.agencyRepository.getById(agencyId);
  if (referedAgency)
    return {
      id: referedAgency.id,
      name: referedAgency.name,
      contactEmail: referedAgency.contactEmail,
      kind: referedAgency.kind,
      siret: referedAgency.agencySiret,
    };
  throw errors.agency.notFound({ agencyId });
};
