import {
  appellationCodesSchema,
  distanceKmSchema,
  localization,
  type ZodSchemaWithInputMatchingOutput,
  zToBoolean,
  zToNumber,
} from "shared";
import { z } from "zod";
import type { SearchParamsPublicV2 } from "./SearchParamsPublicV2.dto";

export const searchParamsPublicV2Schema: ZodSchemaWithInputMatchingOutput<SearchParamsPublicV2> =
  z.object({
    appellationCodes: appellationCodesSchema.optional(),
    latitude: zToNumber,
    longitude: zToNumber,
    distanceKm: distanceKmSchema,
    voluntaryToImmersion: zToBoolean.optional(),
    sortedBy: z
      .enum(["distance", "date"], {
        error: localization.invalidEnum,
      })
      .optional(),
    establishmentSearchableBy: z
      .enum(["students", "jobSeekers"], {
        error: localization.invalidEnum,
      })
      .optional(),
  });
