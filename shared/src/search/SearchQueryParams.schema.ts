import { z } from "zod";
import { romeCodeSchema } from "../rome";
import { appellationCodeSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { siretSchema } from "../siret/siret.schema";
import { zToBoolean, zToNumber } from "../zodUtils";
import { SearchQueryParamsDto } from "./SearchQueryParams.dto";

export const searchQueryParamsSchema: z.Schema<SearchQueryParamsDto> = z.object(
  {
    appellationCode: appellationCodeSchema.optional(),
    siret: siretSchema.optional(),
    latitude: zToNumber,
    longitude: zToNumber,
    distanceKm: zToNumber.positive("'distance_km' doit être > 0").max(100),
    voluntaryToImmersion: z.undefined().or(zToBoolean.optional()),
    place: z.string().optional(),
    sortedBy: z.enum(["distance", "date"]).optional(),
  },
);

export const searchParamsSchema: z.Schema<SearchQueryParamsDto> = z.object({
  rome: romeCodeSchema.optional(),
  appellationCode: appellationCodeSchema.optional(),
  siret: siretSchema.optional(),
  latitude: zToNumber,
  longitude: zToNumber,
  distanceKm: zToNumber.positive("'distance_km' doit être > 0").max(100),
  voluntaryToImmersion: zToBoolean.optional(),
  place: z.string().optional(),
  sortedBy: z.enum(["distance", "date"]).optional(),
});
