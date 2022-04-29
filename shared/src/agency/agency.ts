import {
  AgencyConfig,
  AgencyPublicDisplayDto,
  CreateAgencyConfig,
} from "./agency.dto";

export const toAgencyPublicDisplayDto = (
  agencyConfig: AgencyConfig | CreateAgencyConfig,
): AgencyPublicDisplayDto => ({
  id: agencyConfig.id,
  name: agencyConfig.name,
  address: agencyConfig.address,
  position: agencyConfig.position,
});
