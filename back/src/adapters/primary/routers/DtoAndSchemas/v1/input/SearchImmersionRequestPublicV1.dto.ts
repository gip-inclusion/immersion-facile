import { LatLonDto } from "../../../../../../shared/latLon";
import { RomeCode } from "../../../../../../shared/rome";
import { SearchImmersionRequestDto } from "../../../../../../shared/searchImmersion/SearchImmersionRequest.dto";

export type SearchImmersionRequestPublicV1 = {
  rome?: RomeCode;
  siret?: string;
  location: LatLonDto;
  distance_km: number;
  voluntary_only?: boolean;
};

export const SearchImmersionRequestPublicV1ToDomain = (
  publicV1: SearchImmersionRequestPublicV1,
): SearchImmersionRequestDto => publicV1;
