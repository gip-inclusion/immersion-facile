export type GeoPositionDto = {
  lat: number;
  lon: number;
};
export type WithGeoPosition = {
  position: GeoPositionDto;
};
