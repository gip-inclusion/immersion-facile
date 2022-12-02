import { AbsoluteUrl } from "../AbsoluteUrl";
import { AddressDto, DepartmentCode } from "../address/address.dto";
import { GeoPositionDto } from "../geoPosition/geoPosition.dto";
import { Flavor } from "../typeFlavors";
import { NotEmptyArray, RequireField } from "../utils";

export type AgencyStatus = typeof allAgencyStatuses[number];
export const allAgencyStatuses = [
  "active",
  "closed",
  "needsReview",
  "from-api-PE",
] as const;

export type AgencyDto = RequireField<CreateAgencyDto, "questionnaireUrl"> & {
  kind: AgencyKind;
  status: AgencyStatus;
  adminEmails: string[];
  agencySiret?: string;
  codeSafir?: string;
};

export type PartialAgencyDto = Partial<AgencyDto> & { id: AgencyId };

export type AgencyId = Flavor<string, "AgencyId">;
export type AgencyIdResponse =
  | AgencyId
  | {
      success: boolean;
    };
export type WithAgencyId = {
  id: AgencyId;
};

type AllowedAgencyKindToAdd = Exclude<AgencyKind, "immersion-facile">;

export const agencyKindList: NotEmptyArray<AllowedAgencyKindToAdd> = [
  "pole-emploi",
  "mission-locale",
  "cap-emploi",
  "conseil-departemental",
  "prepa-apprentissage",
  "structure-IAE",
  "cci",
  "autre",
];

export type AgencyOption = {
  id: AgencyId;
  name: string;
};

export type AgencyKind =
  | "immersion-facile"
  | "pole-emploi"
  | "mission-locale"
  | "cap-emploi"
  | "conseil-departemental"
  | "prepa-apprentissage"
  | "structure-IAE"
  | "cci"
  | "autre";

export const activeAgencyStatuses: AgencyStatus[] = ["active", "from-api-PE"];

export type AgencyKindFilter =
  | "peOnly"
  | "peExcluded"
  | "cciOnly"
  | "cciExcluded";

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

export type ListAgenciesRequestDto = Omit<
  GetAgenciesFilter,
  "status" | "position"
>;

export type PrivateListAgenciesRequestDto = {
  status?: AgencyStatus;
};

export type AgencyPublicDisplayDto = Pick<
  CreateAgencyDto,
  "id" | "name" | "address" | "position" | "logoUrl"
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
  logoUrl?: AbsoluteUrl;
  signature: string;
};
