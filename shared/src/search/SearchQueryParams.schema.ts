import { z } from "zod";
import { withAcquisitionSchema } from "../acquisition.dto";
import { withNafCodesSchema } from "../naf/naf.schema";
import {
  makeSortSchema,
  paginationQueryParamsSchema,
} from "../pagination/pagination.schema";
import { romeCodeSchema } from "../rome";
import { appellationCodeSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { siretSchema } from "../siret/siret.schema";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
  zToBoolean,
  zToNumber,
} from "../zodUtils";
import type {
  LegacySearchQueryParamsDto,
  SearchQueryParamsDto,
} from "./SearchQueryParams.dto";

export const distanceKmSchema = z.coerce
  .number()
  .positive("Cette valeur doit être positive")
  .max(100) as ZodSchemaWithInputMatchingOutput<number>;

const legacyGeoParamsSchema = z.discriminatedUnion("sortedBy", [
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

export const legacySearchParamsSchema: ZodSchemaWithInputMatchingOutput<LegacySearchQueryParamsDto> =
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
    .and(legacyGeoParamsSchema)
    .and(withAcquisitionSchema)
    .and(
      z.object({
        rome: romeCodeSchema.optional(),
      }),
    );

const distanceSortSchema = makeSortSchema(z.literal("distance"));
const scoreAndDateSortSchema = makeSortSchema(
  z.enum(["score", "date"], { error: localization.invalidEnum }),
);

const commonGetOffersParamsSchema = z
  .object({
    place: z.string().optional(),
    establishmentSearchableBy: z
      .enum(["students", "jobSeekers"], { error: localization.invalidEnum })
      .optional(),
    fitForDisabledWorkers: z.undefined().or(zToBoolean.optional()),
  })
  .and(paginationQueryParamsSchema);

const requiredGeoSchema = z.object({
  latitude: zToNumber,
  longitude: zToNumber,
  distanceKm: distanceKmSchema,
});

const optionalGeoSchema = z.object({
  latitude: zToNumber.optional(),
  longitude: zToNumber.optional(),
  distanceKm: distanceKmSchema.optional(),
});

export const getOffersParamsSchema: ZodSchemaWithInputMatchingOutput<SearchQueryParamsDto> =
  z.union([
    commonGetOffersParamsSchema
      .and(z.object({ sort: distanceSortSchema }))
      .and(requiredGeoSchema),

    commonGetOffersParamsSchema
      .and(z.object({ sort: scoreAndDateSortSchema }))
      .and(optionalGeoSchema),
  ]);
