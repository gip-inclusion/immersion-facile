import { LatLonDto } from "../latLon";
import { Flavor } from "../typeFlavors";
import { NotEmptyArray, RequireField } from "../utils";

export type AgencyStatus = "active" | "closed" | "needsReview";

export type AgencyConfig = RequireField<
  CreateAgencyConfig,
  "questionnaireUrl"
> & {
  kind: AgencyKind;
  status: AgencyStatus;
  adminEmails: string[];
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

export type ListAgenciesRequestDto = {
  position?: LatLonDto;
};

export type AgencyPublicDisplayDto = Pick<
  CreateAgencyConfig,
  "id" | "name" | "address" | "position"
>;

export type CreateAgencyConfig = {
  id: AgencyId;
  kind: AgencyKind;
  name: string;
  address: string;
  position: LatLonDto;
  counsellorEmails: string[];
  validatorEmails: string[];
  // adminEmails: string[];
  questionnaireUrl?: string;
  signature: string;
};
