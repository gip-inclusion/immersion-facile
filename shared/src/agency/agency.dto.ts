import { keys, omit } from "ramda";
import type { AbsoluteUrl } from "../AbsoluteUrl";
import type { WithAcquisition } from "../acquisition.dto";
import type { AddressDto, DepartmentCode } from "../address/address.dto";
import type { InternshipKind } from "../convention/convention.dto";
import type { Email } from "../email/email.dto";
import type { FederatedIdentity } from "../federatedIdentities/federatedIdentity.dto";
import { isFtConnectIdentity } from "../federatedIdentities/federatedIdentity.dto";
import type { GeoPositionDto } from "../geoPosition/geoPosition.dto";
import type { AgencyRole } from "../role/role.dto";
import type { SiretDto } from "../siret/siret";
import type { Flavor } from "../typeFlavors";
import type { UserId } from "../user/user.dto";
import type { ExtractFromExisting, OmitFromExistingKeys } from "../utils";
import type { DateString } from "../utils/date";

export type CodeSafir = Flavor<string, "CodeSafir">;
export type AgencyStatus = (typeof allAgencyStatuses)[number];
export const allAgencyStatuses = [
  "active",
  "closed",
  "rejected",
  "needsReview",
  "from-api-PE",
] as const;
export const activeAgencyStatuses: AgencyStatus[] = ["active", "from-api-PE"];
export const closedOrRejectedAgencyStatuses: AgencyStatus[] = [
  "closed",
  "rejected",
];

export type CreateAgencyDto = {
  id: AgencyId;
  kind: AgencyKind;
  name: string;
  createdAt: DateString;
  coveredDepartments: DepartmentCode[];
  address: AddressDto;
  position: GeoPositionDto;
  counsellorEmails: Email[];
  validatorEmails: Email[];
  contactEmail: Email;
  agencySiret: SiretDto;
  logoUrl: AbsoluteUrl | null;
  signature: string;
  refersToAgencyId: AgencyId | null;
  refersToAgencyName: string | null;
  refersToAgencyContactEmail: Email | null;
  phoneNumber: string;
  delegationAgencyInfo: DelegationAgencyInfo | null;
} & WithAcquisition;

export type CreateAgencyInitialValues = Omit<CreateAgencyDto, "kind"> & {
  kind: AgencyKind | "";
};

export type AgencyDtoSensitiveFields = {
  status: AgencyStatus;
  statusJustification: string | null;
  codeSafir: CodeSafir | null;
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

export type AgencyKind = (typeof orderedAgencyKindList)[number];

export const orderedAgencyKindList = [
  // ⚠️DO NOT EDIT ORDER ⚠️
  // This is the preferred order for displaying the kinds in a select
  "pole-emploi", // TODO: remplacer l'agency kind PE par FT
  "mission-locale",
  "operateur-cep",
  "cap-emploi",
  "conseil-departemental",
  "structure-IAE",
  "fonction-publique",
  "cci",
  "cma",
  "chambre-agriculture",
  "autre",
  "immersion-facile",
  "prepa-apprentissage", // legacy kept only for backward compatibility
] as const;

export type AllowedAgencyKindToAdd = Exclude<
  AgencyKind,
  "immersion-facile" | "prepa-apprentissage"
>;

export const agencyKindToLabel: Record<AllowedAgencyKindToAdd, string> = {
  "pole-emploi": "France Travail (anciennement Pôle emploi)",
  "mission-locale": "Mission Locale",
  "operateur-cep": "Opérateur du CEP",
  "cap-emploi": "Cap Emploi",
  "conseil-departemental": "Conseil Départemental",
  "structure-IAE": "Structure IAE",
  "fonction-publique": "Fonction publique",
  cci: "Chambres de Commerce et d'Industrie",
  cma: "Chambre des métiers de l'Artisanat",
  "chambre-agriculture": "Chambre d'agriculture",
  autre: "Autre",
};

export const agencyKindToLabelIncludingIFAndPrepa: Record<AgencyKind, string> =
  {
    ...agencyKindToLabel,
    "prepa-apprentissage": "Prépa Apprentissage",
    "immersion-facile": "Immersion Facilitée",
  };

export const allAgencyKindsAllowedToAdd = keys(agencyKindToLabel).sort(
  (a, b) =>
    orderedAgencyKindList.findIndex((kind) => kind === a) -
    orderedAgencyKindList.findIndex((kind) => kind === b),
);

export const fitForDelegationAgencyKind = allAgencyKindsAllowedToAdd.filter(
  (kind) => !["autre", "cci", "operateur-cep"].includes(kind),
);

export const delegationAgencyKindList = [
  "pole-emploi",
  "mission-locale",
  "conseil-departemental",
  "cap-emploi",
] as const;

export type DelegationAgencyKind = (typeof delegationAgencyKindList)[number];

export type DelegationAgencyInfo = {
  delegationEndDate: DateString | null;
  delegationAgencyName: string | null;
  delegationAgencyKind: DelegationAgencyKind | null;
};

export type AgencyOption = {
  id: AgencyId;
  name: string;
  kind: AgencyKind;
  status: AgencyStatus;
  address: AddressDto;
  refersToAgencyName: string | null;
};

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
  needsReview: "En attente d'activation",
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

export const makeListAgencyOptionsKindFilter = ({
  internshipKind,
  shouldListAll,
  federatedIdentity,
}: {
  internshipKind: InternshipKind;
  shouldListAll: boolean;
  federatedIdentity: FederatedIdentity | null;
}): AgencyKindFilter => {
  if (internshipKind === "mini-stage-cci") return "miniStageOnly";
  if (shouldListAll) return "miniStageExcluded";
  return federatedIdentity && isFtConnectIdentity(federatedIdentity)
    ? "immersionPeOnly"
    : "miniStageExcluded";
};

export type WithAgencyIds = {
  agencies: AgencyId[];
};

export type AgencyRight = {
  agency: AgencyDtoForAgencyUsersAndAdmins;
  roles: AgencyRole[];
  isNotifiedByEmail: boolean;
};

export type WithAgencyRights = {
  agencyRights: AgencyRight[];
};

export type AgencyStatsDashboards = {
  // statistics dashboards :
  statsEstablishmentDetailsUrl?: AbsoluteUrl;
  statsConventionsByEstablishmentByDepartmentUrl?: AbsoluteUrl;
  statsAgenciesUrl?: AbsoluteUrl;
};

export type AgencyDashboards = AgencyStatsDashboards & {
  erroredConventionsDashboardUrl?: AbsoluteUrl;
  // convention dashboard :
  agencyDashboardUrl?: AbsoluteUrl;
};

export type WithAgencyDashboards = {
  agencies: AgencyDashboards;
};
