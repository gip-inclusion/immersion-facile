import {
  LatLonDto,
  SearchImmersionResultDto,
} from "../../../shared/SearchImmersionDto";
import { ImmersionOfferEntity } from "../entities/ImmersionOfferEntity";

// Takes two coordinates (in degrees) and returns distance in meters.
// Taken from https://www.movable-type.co.uk/scripts/latlong.html (MIT license)
const distanceBetweenCoordinates = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
};

export const convertEntityToSearchResultDto = (
  entity: ImmersionOfferEntity,
  searchLocation?: LatLonDto,
): SearchImmersionResultDto => {
  const props = entity.getProps();
  return {
    id: props.id,
    rome: props.rome,
    naf: props.naf,
    siret: props.siret,
    name: props.name,
    voluntary_to_immersion: props.voluntaryToImmersion,
    location: props.position,
    address: props.address,
    contact: props.contactInEstablishment
      ? {
          id: props.contactInEstablishment.id,
          first_name: props.contactInEstablishment.firstname,
          last_name: props.contactInEstablishment.name,
          email: props.contactInEstablishment.email,
          role: props.contactInEstablishment.role,
          phone: props.contactInEstablishment.phone,
        }
      : undefined,
    distance_m:
      props.position && searchLocation
        ? Number(
            distanceBetweenCoordinates(
              searchLocation.lat,
              searchLocation.lon,
              props.position.lat,
              props.position.lon,
            ).toFixed(2),
          )
        : undefined,
  };
};
