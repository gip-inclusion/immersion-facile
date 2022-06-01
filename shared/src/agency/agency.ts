import { Agency, AgencyPublicDisplayDto, CreateAgencyDto } from "./agency.dto";

export const toAgencyPublicDisplayDto = (
  agency: Agency | CreateAgencyDto,
): AgencyPublicDisplayDto => ({
  id: agency.id,
  name: agency.name,
  address: agency.address,
  position: agency.position,
});
