import { keys } from "ramda";
import { AbsoluteUrl } from "../AbsoluteUrl";
import { AddressDto, DepartmentCode } from "../address/address.dto";
import { Email } from "../email/email.dto";
import { GeoPositionDto } from "../geoPosition/geoPosition.dto";
import { SiretDto } from "../siret/siret";
import { Flavor } from "../typeFlavors";
import { ExtractFromExisting, RequireField } from "../utils";

export type AgencyStatus = (typeof allAgencyStatuses)[number];
export const allAgencyStatuses = [
  "active",
  "closed",
  "rejected",
  "needsReview",
  "from-api-PE",
] as const;

export type CreateAgencyDto = {
  id: AgencyId;
  kind: AgencyKind;
  name: string;
  address: AddressDto;
  position: GeoPositionDto;
  counsellorEmails: Email[];
  validatorEmails: Email[];
  questionnaireUrl?: string;
  agencySiret: SiretDto;
  logoUrl?: AbsoluteUrl;
  signature: string;
  refersToAgencyId?: AgencyId;
};

export type AgencyDtoSensitiveFields = {
  adminEmails: Email[];
  status: AgencyStatus;
  codeSafir?: string;
  rejectionJustification?: string;
};

export type WithAgencyDto = {
  agency: AgencyDto;
};
export type AgencyDto = RequireField<CreateAgencyDto, "questionnaireUrl"> &
  AgencyDtoSensitiveFields;

export type PartialAgencyDto = Partial<AgencyDto> & { id: AgencyId };

export type AgencyId = Flavor<string, "AgencyId">;
export type AgencyIdResponse = AgencyId | undefined;
export type WithAgencyId = {
  agencyId: AgencyId;
};

export type AgencyKind = (typeof agencyKindList)[number];

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
  "operateur-cep",
] as const;

export type AllowedAgencyKindToAdd = Exclude<AgencyKind, "immersion-facile">;

export const agencyKindToLabel: Record<AllowedAgencyKindToAdd, string> = {
  "mission-locale": "Mission Locale",
  "pole-emploi": "Pôle Emploi",
  "cap-emploi": "Cap Emploi",
  "conseil-departemental": "Conseil Départemental",
  "prepa-apprentissage": "Prépa Apprentissage",
  cci: "Chambres de Commerce et d'Industrie",
  "structure-IAE": "Structure IAE",
  "operateur-cep": "Opérateur du CEP",
  autre: "Autre",
};

export const allAgencyKindsAllowedToAdd = keys(agencyKindToLabel);

export const fitForDelegationAgencyKind = allAgencyKindsAllowedToAdd.filter(
  (kind) => !["autre", "cci", "operateur-cep"].includes(kind),
);

export type AgencyOption = {
  id: AgencyId;
  name: string;
  kind: AgencyKind;
};

export const activeAgencyStatuses: AgencyStatus[] = ["active", "from-api-PE"];

export const agencyKindFilters = [
  "immersionPeOnly",
  "immersionWithoutPe",
  "miniStageOnly",
  "miniStageExcluded",
  "withoutRefersToAgency",
] as const;

export type AgencyKindFilter = (typeof agencyKindFilters)[number];

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

// TODO Rename into UpdateAgencyRequestStatusDto ?
export type UpdateAgencyRequestDto = Partial<Pick<AgencyDto, "status">> & {
  // | "name" | "logoUrl" | "address" (coming soon.)
  id: AgencyId;
};

export type WithAgencyStatus = { status: AgencyStatus };

export type ActiveOrRejectedStatus = ExtractFromExisting<
  AgencyStatus,
  "active" | "rejected"
>;
