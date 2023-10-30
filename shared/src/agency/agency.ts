import { AgencyDto, AgencyPublicDisplayDto } from "./agency.dto";

export const toAgencyPublicDisplayDto = (
  agency: AgencyDto,
  referedAgency?: AgencyDto,
): AgencyPublicDisplayDto => {
  if (
    agency.refersToAgencyId &&
    referedAgency &&
    agency.id !== referedAgency.id
  )
    throw new Error(
      "Agency.refersToAgencyId and referedAgency.id are not identical.",
    );

  return {
    id: agency.id,
    name: agency.name,
    kind: agency.kind,
    address: agency.address,
    position: agency.position,
    signature: agency.signature,
    logoUrl: agency.logoUrl,
    agencySiret: agency.agencySiret,
    refersToAgency:
      agency.refersToAgencyId && referedAgency
        ? {
            id: referedAgency.id,
            address: referedAgency.address,
            kind: referedAgency.kind,
            name: referedAgency.name,
            position: referedAgency.position,
            signature: referedAgency.signature,
            agencySiret: referedAgency.agencySiret,
            logoUrl: referedAgency.logoUrl,
          }
        : undefined,
  };
};
