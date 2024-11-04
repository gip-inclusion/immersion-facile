import { z } from "zod";
import { withAcquisitionSchema } from "../acquisition.dto";
import { romeCodeSchema } from "../rome";
import { appellationCodeSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { siretSchema } from "../siret/siret.schema";
import { zToBoolean, zToNumber } from "../zodUtils";
import { SearchQueryParamsDto } from "./SearchQueryParams.dto";

const geoParamsSchema = z.discriminatedUnion("sortedBy", [
  z.object({
    sortedBy: z.enum(["date", "score"]),
    latitude: zToNumber.optional(),
    longitude: zToNumber.optional(),
    distanceKm: zToNumber
      .positive("'distance_km' doit être > 0")
      .max(100)
      .optional(),
  }),
  z.object({
    sortedBy: z.literal("distance"),
    latitude: zToNumber,
    longitude: zToNumber,
    distanceKm: zToNumber.positive("'distance_km' doit être > 0").max(100),
  }),
]);

export const searchParamsSchema: z.Schema<SearchQueryParamsDto> = z
  .object({
    appellationCodes: z.array(appellationCodeSchema).optional(),
    siret: siretSchema.optional(),
    voluntaryToImmersion: z.undefined().or(zToBoolean.optional()),
    place: z.string().optional(),
    establishmentSearchableBy: z.enum(["students", "jobSeekers"]).optional(),
    fitForDisabledWorkers: z.undefined().or(zToBoolean.optional()),
  })
  .and(geoParamsSchema)
  .and(withAcquisitionSchema)
  .and(
    z.object({
      rome: romeCodeSchema.optional(),
    }),
  );
