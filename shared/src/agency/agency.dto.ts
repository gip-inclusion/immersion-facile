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
  agencySiret?: SiretDto;
  logoUrl?: AbsoluteUrl;
  signature: string;
  refersToAgencyId?: AgencyId;
};

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

type WithOptionalRefersToAgency = {
  refersToAgency?: AgencyPublicDisplayDtoWithoutRefersToAgency;
};

export type AgencyPublicDisplayDto =
  AgencyPublicDisplayDtoWithoutRefersToAgency & WithOptionalRefersToAgency;

export type AgencyDtoSensitiveFields = {
  adminEmails: Email[];
  status: AgencyStatus;
  codeSafir?: string;
};

export type AgencyDto = RequireField<CreateAgencyDto, "questionnaireUrl"> & {
  refersToAgencyId?: never;
} & WithOptionalRefersToAgency &
  AgencyDtoSensitiveFields;

export type PartialAgencyDto = Partial<AgencyDto> & { id: AgencyId };

export type SaveAgencyParams = RequireField<
  CreateAgencyDto,
  "questionnaireUrl"
> &
  AgencyDtoSensitiveFields & {
    refersToAgency?: never;
  };

export type PartialAgencySaveParams = Partial<SaveAgencyParams> & {
  id: AgencyId;
};

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

export type AgencyOption = {
  id: AgencyId;
  name: string;
  kind: AgencyKind;
};

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
export type WithActiveOrRejectedStatus = { status: ActiveOrRejectedStatus };
