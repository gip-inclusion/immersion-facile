import { keys, omit } from "ramda";
import { AbsoluteUrl } from "../AbsoluteUrl";
import { WithAcquisition } from "../acquisition.dto";
import { AddressDto, DepartmentCode } from "../address/address.dto";
import { Email } from "../email/email.dto";
import { GeoPositionDto } from "../geoPosition/geoPosition.dto";
import {
  AgencyRole,
  UserId,
} from "../inclusionConnectedAllowed/inclusionConnectedAllowed.dto";
import { SiretDto } from "../siret/siret";
import { Flavor } from "../typeFlavors";
import type { ExtractFromExisting, OmitFromExistingKeys } from "../utils";

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
  refersToAgencyName: string | null;
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

export type AgencyUserRight = {
  roles: AgencyRole[];
  isNotifiedByEmail: boolean;
};
export type AgencyUsersRights = Partial<Record<UserId, AgencyUserRight>>;
export type WithAgencyUserRights = {
  usersRights: AgencyUsersRights;
};
export type AgencyWithUsersRights = OmitFromExistingKeys<
  AgencyDto,
  "counsellorEmails" | "validatorEmails"
> &
  WithAgencyUserRights;

export type PartialAgencyDto = Partial<AgencyDto> & { id: AgencyId };

type WithAdminEmails = {
  admins: Email[];
};

export type AgencyDtoForAgencyUsersAndAdmins = OmitFromExistingKeys<
  AgencyDto,
  "counsellorEmails" | "validatorEmails"
> &
  WithAdminEmails;

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
  "pole-emploi", // TODO: remplacer l'agency kind PE par FT
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

export const agencyKindToLabelIncludingIF: Record<AgencyKind, string> = {
  ...agencyKindToLabel,
  "immersion-facile": "Immersion Facilitée",
};

export const allAgencyKindsAllowedToAdd = keys(agencyKindToLabel);

export const fitForDelegationAgencyKind = allAgencyKindsAllowedToAdd.filter(
  (kind) => !["autre", "cci", "operateur-cep"].includes(kind),
);

export type AgencyOption = {
  id: AgencyId;
  name: string;
  kind: AgencyKind;
  status: AgencyStatus;
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
  filterKind?: AgencyKindFilter;
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

export const agencyStatusToLabel: Record<AgencyStatus, string> = {
  active: "Active",
  closed: "Fermée",
  rejected: "Rejetée",
  needsReview: "En attende d'activation",
  "from-api-PE": "Import Api",
};

export const toAgencyDtoForAgencyUsersAndAdmins = (
  agency: AgencyDto | AgencyWithUsersRights,
  admins: Email[],
): AgencyDtoForAgencyUsersAndAdmins => ({
  ...("usersRights" in agency
    ? omit(["usersRights"], agency)
    : omit(["counsellorEmails", "validatorEmails"], agency)),
  admins,
});
