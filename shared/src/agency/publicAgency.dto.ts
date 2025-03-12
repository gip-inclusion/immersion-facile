import type { CreateAgencyDto } from "./agency.dto";

export type AgencyPublicDisplayDtoWithoutRefersToAgency = Pick<
  CreateAgencyDto,
  | "id"
  | "name"
  | "kind"
  | "address"
  | "position"
  | "agencySiret"
  | "logoUrl"
  | "signature"
>;

export type WithOptionalRefersToAgency = {
  refersToAgency: AgencyPublicDisplayDtoWithoutRefersToAgency | null;
};

export type AgencyPublicDisplayDto =
  AgencyPublicDisplayDtoWithoutRefersToAgency & WithOptionalRefersToAgency;
