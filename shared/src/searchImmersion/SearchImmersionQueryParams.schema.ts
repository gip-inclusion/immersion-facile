import { z } from "zod";
import { romeCodeSchema } from "../rome";
import { siretSchema } from "../siret";
import { zPreprocessedBoolean, zPreprocessedNumber } from "../zodUtils";
import { SearchImmersionQueryParamsDto } from "./SearchImmersionQueryParams.dto";

export const searchImmersionQueryParamsSchema: z.Schema<SearchImmersionQueryParamsDto> =
  z.object({
    rome: romeCodeSchema.optional(),
    siret: siretSchema.optional(),
    latitude: zPreprocessedNumber(),
    longitude: zPreprocessedNumber(),
    distance_km: zPreprocessedNumber(
      z.number().positive("'distance_km' doit être > 0").max(100),
    ),
    voluntaryToImmersion: zPreprocessedBoolean().optional(),
    sortedBy: z.enum(["distance", "date"]),
  });
