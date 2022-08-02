import { GeoPositionDto } from "shared/src/geoPosition/geoPosition.dto";
import { RomeCode } from "shared/src/rome";
import { SearchImmersionQueryParamsDto } from "shared/src/searchImmersion/SearchImmersionQueryParams.dto";

export type SearchImmersionRequestPublicV0 = {
  rome?: RomeCode;
  location: GeoPositionDto;
  distance_km: number;
};

export const searchImmersionRequestPublicV0ToDomain = (
  publicV0: SearchImmersionRequestPublicV0,
): SearchImmersionQueryParamsDto => {
  const { location, ...rest } = publicV0;
  return {
    ...rest,
    longitude: location.lon,
    latitude: location.lat,
    sortedBy: "distance",
  };
};
