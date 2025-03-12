// Takes two coordinates (in degrees) and returns distance in meters.

import type { GeoPositionDto } from "shared";

// Taken from https://www.movable-type.co.uk/scripts/latlong.html (MIT license)
export const distanceBetweenCoordinatesInMeters = (
  pointA: GeoPositionDto,
  pointB: GeoPositionDto,
) => {
  const { lat: latA, lon: lonA } = pointA;
  const { lat: latB, lon: lonB } = pointB;
  const R = 6371e3; // metres
  const φ1 = (latA * Math.PI) / 180; // φ, λ in radians
  const φ2 = (latB * Math.PI) / 180;
  const Δφ = ((latB - latA) * Math.PI) / 180;
  const Δλ = ((lonB - lonA) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // in metres
};
