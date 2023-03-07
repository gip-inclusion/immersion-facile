import {
  AgencyDto,
  AgencyPublicDisplayDto,
  CreateAgencyDto,
} from "./agency.dto";

export const toAgencyPublicDisplayDto = (
  agency: AgencyDto | CreateAgencyDto,
): AgencyPublicDisplayDto => ({
  id: agency.id,
  name: agency.name,
  address: agency.address,
  position: agency.position,
  signature: agency.signature,
  logoUrl: agency.logoUrl,
});
