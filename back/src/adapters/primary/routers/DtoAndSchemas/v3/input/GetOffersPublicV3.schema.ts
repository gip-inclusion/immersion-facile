import {
  addressDepartmentCodeSchema,
  appellationCodeSchema,
  fitForDisabledWorkersSchema,
  localization,
  nafCodesSchema,
  paginationQueryParamsSchema,
  type SortDirection,
  siretSchema,
  sortDirectionSchema,
  withAcquisitionSchema,
  withOptionalRemoteWorkModesSchema,
  zStringCanBeEmpty,
  zToBoolean,
  zToNumber,
  zUuidLike,
} from "shared";
import z from "zod";
import type { GetOffersFlatParamsPublicV3 } from "./GetOffersPublicV3.dto";

const distanceKmSchema = zToNumber.pipe(
  z.number().positive("Cette valeur doit être positive").max(100),
);

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

const geoParamsAndSortPublicV3Schema = z.discriminatedUnion("sortBy", [
  geoParamsByDateOrScoreSchema,
  geoParamsByDistanceSchema,
]);

export const getOffersFlatParamsSchemaPublicV3Schema: z.ZodType<
  GetOffersFlatParamsPublicV3,
  Omit<GetOffersFlatParamsPublicV3, "sortOrder"> & {
    sortOrder?: SortDirection | undefined;
  }
> = z
  .object({
    appellationCodes: z.array(appellationCodeSchema).optional(),
    departmentCodes: z.array(addressDepartmentCodeSchema).optional(),
    fitForDisabledWorkers: z.array(fitForDisabledWorkersSchema).optional(),
    locationIds: z.array(zUuidLike).optional(),
    nafCodes: nafCodesSchema.optional(),
    sirets: z.array(siretSchema).optional(),
    searchableBy: z
      .enum(["students", "jobSeekers"], {
        error: localization.invalidEnum,
      })
      .optional(),
    place: zStringCanBeEmpty.optional(),
    showOnlyAvailableOffers: zToBoolean.optional(),
  })
  .and(paginationQueryParamsSchema)
  .and(geoParamsAndSortPublicV3Schema)
  .and(withAcquisitionSchema)
  .and(withOptionalRemoteWorkModesSchema);
