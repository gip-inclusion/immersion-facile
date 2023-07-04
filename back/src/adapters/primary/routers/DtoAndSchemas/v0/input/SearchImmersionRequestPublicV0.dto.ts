import {
  GeoPositionDto,
  RomeCode,
  SearchImmersionQueryParamsDto,
} from "shared";

export type SearchImmersionRequestPublicV0 = {
  rome?: RomeCode;
  location: GeoPositionDto;
  distance_km: number;
};

export const searchImmersionRequestPublicV0ToDomain = (
  publicV0: SearchImmersionRequestPublicV0,
): SearchImmersionQueryParamsDto => {
  const { location, distance_km, ...rest } = publicV0;
  return {
    ...rest,
    longitude: location.lon,
    latitude: location.lat,
    sortedBy: "distance",
    distanceKm: distance_km,
  };
};
