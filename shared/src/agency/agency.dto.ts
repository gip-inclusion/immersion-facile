import { keys } from "ramda";
import { AbsoluteUrl } from "../AbsoluteUrl";
import { WithAcquisition } from "../acquisition.dto";
import { AddressDto, DepartmentCode } from "../address/address.dto";
import { Email } from "../email/email.dto";
import { GeoPositionDto } from "../geoPosition/geoPosition.dto";
import { SiretDto } from "../siret/siret";
import { Flavor } from "../typeFlavors";
import { ExtractFromExisting } from "../utils";

export type CodeSafir = Flavor<string, "CodeSafir">;
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
  coveredDepartments: DepartmentCode[];
  address: AddressDto;
  position: GeoPositionDto;
  counsellorEmails: Email[];
  validatorEmails: Email[];
  questionnaireUrl: AbsoluteUrl | null;
  agencySiret: SiretDto;
  logoUrl: AbsoluteUrl | null;
  signature: string;
  refersToAgencyId: AgencyId | null;
} & WithAcquisition;

export type AgencyDtoSensitiveFields = {
  status: AgencyStatus;
  codeSafir: CodeSafir | null;
  rejectionJustification: string | null;
};

export type WithAgencyDto = {
  agency: AgencyDto;
};
export type AgencyDto = CreateAgencyDto & AgencyDtoSensitiveFields;

export type PartialAgencyDto = Partial<AgencyDto> & { id: AgencyId };

export type AgencyId = Flavor<string, "AgencyId">;
export type AgencyIdResponse = AgencyId | undefined;
export type WithAgencyId = {
  agencyId: AgencyId;
};

export const miniStageAgencyKinds: AgencyKind[] = [
  "cci",
  "cma",
  "chambre-agriculture",
];

export type AgencyKind = (typeof agencyKindList)[number];

export const agencyKindList = [
  "pole-emploi",
  "mission-locale",
  "cap-emploi",
  "conseil-departemental",
  "prepa-apprentissage",
  "structure-IAE",
  "autre",
  "immersion-facile",
  "operateur-cep",
  "cci",
  "cma",
  "chambre-agriculture",
] as const;

export type AllowedAgencyKindToAdd = Exclude<AgencyKind, "immersion-facile">;

export const agencyKindToLabel: Record<AllowedAgencyKindToAdd, string> = {
  "mission-locale": "Mission Locale",
  "pole-emploi": "France Travail (anciennement Pôle emploi)",
  "cap-emploi": "Cap Emploi",
  "conseil-departemental": "Conseil Départemental",
  "prepa-apprentissage": "Prépa Apprentissage",
  "structure-IAE": "Structure IAE",
  "operateur-cep": "Opérateur du CEP",
  cci: "Chambres de Commerce et d'Industrie",
  cma: "Chambre des métiers de l'Artisanat",
  "chambre-agriculture": "Chambre d'agriculture",
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
  siret?: SiretDto;
};

export type ListAgencyOptionsRequestDto = Omit<GetAgenciesFilter, "position">;

export type PrivateListAgenciesRequestDto = {
  status?: AgencyStatus;
};

export type WithAgencyStatus = { status: AgencyStatus };

export type ActiveOrRejectedStatus = ExtractFromExisting<
  AgencyStatus,
  "active" | "rejected"
>;
