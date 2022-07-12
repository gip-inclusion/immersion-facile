import { AbsoluteUrl } from "../AbsoluteUrl";
import { LatLonDto } from "../latLon";
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

export const agencyKindList: NotEmptyArray<
  Exclude<AgencyKind, "immersion-facile">
> = [
  "pole-emploi",
  "mission-locale",
  "cap-emploi",
  "conseil-departemental",
  "prepa-apprentissage",
  "structure-IAE",
  "autre",
];

export type AgencyWithPositionDto = {
  id: AgencyId;
  name: string;
  position: LatLonDto;
};

export type AgencyKind =
  | "immersion-facile"
  | "pole-emploi"
  | "mission-locale"
  | "cap-emploi"
  | "conseil-departemental"
  | "prepa-apprentissage"
  | "structure-IAE"
  | "autre";

export const activeAgencyStatuses: AgencyStatus[] = ["active", "from-api-PE"];

export type AgencyKindFilter = "peOnly" | "peExcluded";

export type AgencyPositionFilter = {
  position: LatLonDto;
  distance_km: number;
};

export type GetAgenciesFilter = {
  position?: AgencyPositionFilter;
  kind?: AgencyKindFilter;
  status?: AgencyStatus[];
};

export type ListAgenciesWithPositionRequestDto = {
  lon?: number;
  lat?: number;
  filter?: AgencyKindFilter;
};

export type PrivateListAgenciesRequestDto = {
  status?: AgencyStatus;
};

export type AgencyPublicDisplayDto = Pick<
  CreateAgencyDto,
  "id" | "name" | "address" | "position" | "logoUrl"
>;

export type UpdateAgencyRequestDto = Partial<Pick<AgencyDto, "status">> & {
  // | "name" | "logoUrl" | "address" (coming soon.)
  id: AgencyId;
};

export type CreateAgencyDto = {
  id: AgencyId;
  kind: AgencyKind;
  name: string;
  address: string;
  position: LatLonDto;
  counsellorEmails: string[];
  validatorEmails: string[];
  // adminEmails: string[];
  questionnaireUrl?: string;
  logoUrl?: AbsoluteUrl;
  signature: string;
};
