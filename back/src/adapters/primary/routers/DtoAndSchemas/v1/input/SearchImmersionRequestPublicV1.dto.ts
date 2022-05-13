import { LatLonDto } from "shared/src/latLon";
import { RomeCode } from "shared/src/rome";
import { SearchImmersionRequestDto } from "shared/src/searchImmersion/SearchImmersionRequest.dto";

export type SearchImmersionRequestPublicV1 = {
  rome?: RomeCode;
  siret?: string;
  location: LatLonDto;
  distance_km: number;
  voluntary_only?: boolean;
  sortedBy: "distance" | "date";
};

export const SearchImmersionRequestPublicV1ToDomain = (
  publicV1: SearchImmersionRequestPublicV1,
): SearchImmersionRequestDto => publicV1;
