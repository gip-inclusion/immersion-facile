import { z } from "zod";
import { withAcquisitionSchema } from "../acquisition.dto";
import { withNafCodesSchema } from "../naf/naf.schema";
import { romeCodeSchema } from "../rome";
import { appellationCodeSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { siretSchema } from "../siret/siret.schema";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
  zToBoolean,
  zToNumber,
} from "../zodUtils";
import type { SearchQueryParamsDto } from "./SearchQueryParams.dto";

export const distanceKmSchema = z.coerce
  .number()
  .positive("Cette valeur doit être positive")
  .max(100) as ZodSchemaWithInputMatchingOutput<number>;

const geoParamsSchema = z.discriminatedUnion("sortedBy", [
  z.object({
    sortedBy: z.enum(["date", "score"], {
      error: localization.invalidEnum,
    }),
    latitude: zToNumber.optional(),
    longitude: zToNumber.optional(),
    distanceKm: distanceKmSchema.optional(),
  }),
  z.object({
    sortedBy: z.literal("distance"),
    latitude: zToNumber,
    longitude: zToNumber,
    distanceKm: distanceKmSchema,
  }),
]);

export const searchParamsSchema: ZodSchemaWithInputMatchingOutput<SearchQueryParamsDto> =
  z
    .object({
      appellationCodes: z.array(appellationCodeSchema).optional(),
      siret: siretSchema.optional(),
      voluntaryToImmersion: z.undefined().or(zToBoolean.optional()),
      place: z.string().optional(),
      establishmentSearchableBy: z
        .enum(["students", "jobSeekers"], {
          error: localization.invalidEnum,
        })
        .optional(),
      fitForDisabledWorkers: z.undefined().or(zToBoolean.optional()),
    })
    .and(withNafCodesSchema)
    .and(geoParamsSchema)
    .and(withAcquisitionSchema)
    .and(
      z.object({
        rome: romeCodeSchema.optional(),
      }),
    );
