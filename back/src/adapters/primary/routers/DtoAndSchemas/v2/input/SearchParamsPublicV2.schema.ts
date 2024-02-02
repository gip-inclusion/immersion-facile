import { appellationCodesSchema, zToBoolean, zToNumber } from "shared";
import { z } from "zod";
import { SearchParamsPublicV2 } from "./SearchParamsPublicV2.dto";

export const searchParamsPublicV2Schema: z.Schema<SearchParamsPublicV2> =
  z.object({
    appellationCodes: appellationCodesSchema.optional(),
    latitude: zToNumber,
    longitude: zToNumber,
    distanceKm: zToNumber.positive("'distance_km' doit être > 0").max(100),
    voluntaryToImmersion: zToBoolean.optional(),
    sortedBy: z.enum(["distance", "date"]).optional(),
    establishmentSearchableBy: z.enum(["students", "jobSeekers"]).optional(),
  });
