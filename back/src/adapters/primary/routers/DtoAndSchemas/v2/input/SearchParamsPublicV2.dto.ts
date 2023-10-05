import { AppellationCode, RomeCode } from "shared";

type SearchSortedBy = "distance" | "date";

export type SearchParamsPublicV2 = {
  longitude: number;
  latitude: number;
  rome?: RomeCode;
  appellationCodes?: AppellationCode[];
  distanceKm: number;
  sortedBy?: SearchSortedBy;
  voluntaryToImmersion?: boolean;
};
