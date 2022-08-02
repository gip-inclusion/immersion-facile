import { geoPositionSchema } from "shared/src/geoPosition/geoPosition.schema";
import { romeCodeSchema } from "shared/src/rome";
import { z } from "zod";
import { SearchImmersionRequestPublicV0 } from "./SearchImmersionRequestPublicV0.dto";

export const searchImmersionRequestSchemaPublivV0: z.Schema<SearchImmersionRequestPublicV0> =
  z.object({
    rome: romeCodeSchema.optional(),
    location: geoPositionSchema,
    distance_km: z.number().positive("'distance_km' doit être > 0"),
  });
