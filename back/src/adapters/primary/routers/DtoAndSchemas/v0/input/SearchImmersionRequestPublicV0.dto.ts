import { LatLonDto } from "shared/src/latLon";
import { RomeCode } from "shared/src/rome";
import { SearchImmersionRequestDto } from "shared/src/searchImmersion/SearchImmersionRequest.dto";

export type SearchImmersionRequestPublicV0 = {
  rome?: RomeCode;
  location: LatLonDto;
  distance_km: number;
};

export const searchImmersionRequestPublicV0ToDomain = (
  publicV0: SearchImmersionRequestPublicV0,
): SearchImmersionRequestDto => ({
  ...publicV0,
  sortedBy: "distance",
  position: publicV0.location,
});
