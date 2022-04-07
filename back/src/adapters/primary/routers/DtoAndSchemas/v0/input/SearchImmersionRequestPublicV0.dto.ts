import { LatLonDto } from "../../../../../../shared/latLon";
import { RomeCode } from "../../../../../../shared/rome";
import { SearchImmersionRequestDto } from "../../../../../../shared/searchImmersion/SearchImmersionRequest.dto";

export type SearchImmersionRequestPublicV0 = {
  rome?: RomeCode;
  siret?: string;
  location: LatLonDto;
  distance_km: number;
};

export const SearchImmersionRequestPublicV0ToDomain = (
  publicV0: SearchImmersionRequestPublicV0,
): SearchImmersionRequestDto => publicV0;
