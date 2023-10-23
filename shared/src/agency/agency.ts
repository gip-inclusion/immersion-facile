import { AgencyDto, AgencyPublicDisplayDto } from "./agency.dto";

export const toAgencyPublicDisplayDto = (
  agency: AgencyDto,
): AgencyPublicDisplayDto => ({
  id: agency.id,
  name: agency.name,
  kind: agency.kind,
  address: agency.address,
  position: agency.position,
  signature: agency.signature,
  logoUrl: agency.logoUrl,
  agencySiret: agency.agencySiret,
  refersToAgency: agency.refersToAgency,
});
