import { z } from "zod";
import { withAcquisitionSchema } from "../acquisition.dto";
import { fitForDisabledWorkersSchema } from "../formEstablishment/FormEstablishment.schema";
import { nafCodesSchema, withNafCodesSchema } from "../naf/naf.schema";
import type { SortDirection } from "../pagination/pagination.dto";
import {
  paginationQueryParamsSchema,
  sortDirectionSchema,
} from "../pagination/pagination.schema";
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
  GetExternalOffersFlatQueryParams,
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

const latLonDistanceSchema = z.object({
  latitude: zToNumber,
  longitude: zToNumber,
  distanceKm: distanceKmSchema,
});

const geoParamsByDistanceSchema = z.object({
  sortBy: z.literal("distance"),
  sortOrder: sortDirectionSchema.default("asc"),
  latitude: zToNumber,
  longitude: zToNumber,
  distanceKm: distanceKmSchema,
});

const geoParamsByDateOrScoreSchema = z.object({
  sortBy: z.enum(["date", "score"], {
    error: localization.invalidEnum,
  }),
  sortOrder: sortDirectionSchema.default("desc"),
  latitude: zToNumber.optional(),
  longitude: zToNumber.optional(),
  distanceKm: distanceKmSchema.optional(),
});

const geoParamsAndSortSchema = z.discriminatedUnion("sortBy", [
  geoParamsByDateOrScoreSchema,
  geoParamsByDistanceSchema,
]);

export const getOffersFlatParamsSchema: z.ZodType<
  GetOffersFlatQueryParams,
  Omit<GetOffersFlatQueryParams, "sortOrder"> & {
    sortOrder?: SortDirection | undefined;
  }
> = z
  .object({
    appellationCodes: z.array(appellationCodeSchema).optional(),
    fitForDisabledWorkers: z.array(fitForDisabledWorkersSchema).optional(),
    locationIds: z.array(zUuidLike).optional(),
    nafCodes: nafCodesSchema.optional(),
    sirets: z.array(siretSchema).optional(),
    searchableBy: z
      .enum(["students", "jobSeekers"], {
        error: localization.invalidEnum,
      })
      .optional(),
  })
  .and(paginationQueryParamsSchema)
  .and(geoParamsAndSortSchema)
  .and(withAcquisitionSchema);

export const getExternalOffersFlatParamsSchema: z.ZodType<
  GetExternalOffersFlatQueryParams,
  Omit<GetExternalOffersFlatQueryParams, "sortOrder"> & {
    sortOrder?: SortDirection;
  }
> = z
  .object({
    appellationCode: appellationCodeSchema,
    nafCodes: nafCodesSchema.optional(),
  })
  .and(paginationQueryParamsSchema)
  .and(latLonDistanceSchema)
  .and(withAcquisitionSchema);
