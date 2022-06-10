import { AbsoluteUrl } from "../AbsoluteUrl";
import { LatLonDto } from "../latLon";
import { Flavor } from "../typeFlavors";
import { NotEmptyArray, RequireField } from "../utils";

export type AgencyStatus = "active" | "closed" | "needsReview" | "from-api-PE";

export type AgencyDto = RequireField<CreateAgencyDto, "questionnaireUrl"> & {
  kind: AgencyKind;
  status: AgencyStatus;
  adminEmails: string[];
  agencySiret?: string;
  codeSafir?: string;
};

export type AgencyId = Flavor<string, "AgencyId">;

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

export type AgencyInListDto = {
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

type ListAgenciesRequestFilter = "peOnly" | "peExcluded";

export type ListAgenciesRequestDto = {
  position?: LatLonDto;
  filter?: ListAgenciesRequestFilter;
};

export type AgencyPublicDisplayDto = Pick<
  CreateAgencyDto,
  "id" | "name" | "address" | "position" | "logoUrl"
>;

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
