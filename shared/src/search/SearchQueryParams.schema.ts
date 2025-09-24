import { z } from "zod";
import { withAcquisitionSchema } from "../acquisition.dto";
import { nafCodesSchema, withNafCodesSchema } from "../naf/naf.schema";
import type { SortDirection } from "../pagination/pagination.dto";
import { sortOrderSchema } from "../pagination/pagination.schema";
import { romeCodeSchema } from "../rome";
import { appellationCodeSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { siretSchema } from "../siret/siret.schema";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
  zToBoolean,
  zToNumber,
  zUuidLike,
} from "../zodUtils";

import type {
  GetOffersFlatQueryParams,
  LegacySearchQueryParamsDto,
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

const geoParamsAndSortSchema = z.discriminatedUnion("sortBy", [
  z.object({
    sortBy: z.enum(["date", "score"], {
      error: localization.invalidEnum,
    }),
    sortOrder: sortOrderSchema.default("desc"),
    latitude: zToNumber.optional(),
    longitude: zToNumber.optional(),
    distanceKm: distanceKmSchema.optional(),
  }),
  z.object({
    sortBy: z.literal("distance"),
    sortOrder: sortOrderSchema.default("asc"),
    latitude: zToNumber,
    longitude: zToNumber,
    distanceKm: distanceKmSchema,
  }),
]);

export const getOffersFlatParamsSchema: z.ZodType<
  GetOffersFlatQueryParams,
  Omit<GetOffersFlatQueryParams, "sortOrder"> & {
    sortOrder?: SortDirection | undefined;
  }
> = z
  .object({
    appellationCodes: z.array(appellationCodeSchema).optional(),
    fitForDisabledWorkers: z.undefined().or(zToBoolean.optional()).optional(),
    locationIds: z.array(zUuidLike).optional(),
    nafCodes: nafCodesSchema.optional(),
    sirets: z.array(siretSchema).optional(),
    searchableBy: z
      .enum(["students", "jobSeekers"], {
        error: localization.invalidEnum,
      })
      .optional(),
  })
  .and(geoParamsAndSortSchema)
  .and(withAcquisitionSchema);
