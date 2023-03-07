import { RequireField } from "../utils";
import { AbsoluteUrl } from "../AbsoluteUrl";
import { AddressDto, DepartmentCode } from "../address/address.dto";
import { GeoPositionDto } from "../geoPosition/geoPosition.dto";
import { Flavor } from "../typeFlavors";
import { SiretDto } from "../siret/siret";

export type AgencyStatus = (typeof allAgencyStatuses)[number];
export const allAgencyStatuses = [
  "active",
  "closed",
  "rejected",
  "needsReview",
  "from-api-PE",
] as const;

export type AgencyDto = Omit<
  RequireField<CreateAgencyDto, "questionnaireUrl">,
  "agencySiret"
> & {
  kind: AgencyKind;
  status: AgencyStatus;
  adminEmails: string[];
  codeSafir?: string;
  agencySiret?: SiretDto;
};

export type PartialAgencyDto = Partial<AgencyDto> & { id: AgencyId };

export type AgencyId = Flavor<string, "AgencyId">;
export type AgencyIdResponse = AgencyId | undefined;
export type WithAgencyId = {
  id: AgencyId;
};

export const agencyKindList = [
  "pole-emploi",
  "mission-locale",
  "cap-emploi",
  "conseil-departemental",
  "prepa-apprentissage",
  "structure-IAE",
  "cci",
  "autre",
  "immersion-facile",
] as const;

export type AgencyOption = {
  id: AgencyId;
  name: string;
};

export type AgencyKind = (typeof agencyKindList)[number];

export const activeAgencyStatuses: AgencyStatus[] = ["active", "from-api-PE"];

export type AgencyKindFilter =
  | "immersionPeOnly"
  | "immersionWithoutPe"
  | "miniStageOnly"
  | "miniStageExcluded";

export type AgencyPositionFilter = {
  position: GeoPositionDto;
  distance_km: number;
};

export type GetAgenciesFilter = {
  nameIncludes?: string;
  position?: AgencyPositionFilter;
  departmentCode?: DepartmentCode;
  kind?: AgencyKindFilter;
  status?: AgencyStatus[];
};

export type ListAgenciesRequestDto = Omit<GetAgenciesFilter, "position">;

export type PrivateListAgenciesRequestDto = {
  status?: AgencyStatus;
};

export type AgencyPublicDisplayDto = Pick<
  CreateAgencyDto,
  "id" | "name" | "address" | "position" | "logoUrl" | "signature"
>;

// TODO Rename into UpdateAgencyRequestStatusDto ?
export type UpdateAgencyRequestDto = Partial<Pick<AgencyDto, "status">> & {
  // | "name" | "logoUrl" | "address" (coming soon.)
  id: AgencyId;
};

export type CreateAgencyDto = {
  id: AgencyId;
  kind: AgencyKind;
  name: string;
  address: AddressDto;
  position: GeoPositionDto;
  counsellorEmails: string[];
  validatorEmails: string[];
  // adminEmails: string[];
  questionnaireUrl?: string;
  agencySiret: SiretDto;
  logoUrl?: AbsoluteUrl;
  signature: string;
};
