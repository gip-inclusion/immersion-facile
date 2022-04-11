import { LatLonDto } from "../latLon";
import { Flavor } from "../typeFlavors";
import { NotEmptyArray } from "../utils";

export type AgencyId = Flavor<string, "AgencyId">;

// There is a kind 'immersion-facile' in db for edge cases which is not declared here intentionally.
export const agencyKindList: NotEmptyArray<AgencyKind> = [
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
