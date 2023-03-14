import { Flavor } from "../typeFlavors";

type Latitude = Flavor<number, "Latitude">;
type Longitude = Flavor<number, "Longitude">;

export type GeoPositionDto = {
  lat: Latitude;
  lon: Longitude;
};
export type WithGeoPosition = {
  position: GeoPositionDto;
};
