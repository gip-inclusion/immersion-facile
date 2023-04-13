import { z } from "zod";

import { GeoPositionDto } from "./geoPosition.dto";

export const geoPositionSchema: z.Schema<GeoPositionDto> = z.object({
  lat: z
    .number()
    .gte(-90, "'lat' doit être >= -90.0")
    .lte(90, "'lat' doit être <= 90.0")
    .refine(
      (value) => value !== 0,
      "0 est une latitude par défaut qui ne semble pas correcte",
    ),
  lon: z
    .number()
    .gte(-180, "'lon' doit être >= 180.0")
    .lte(180, "'lon' doit être <= 180.0")
    .refine(
      (value) => value !== 0,
      "0 est une longitude par défaut qui ne semble pas correcte",
    ),
});
