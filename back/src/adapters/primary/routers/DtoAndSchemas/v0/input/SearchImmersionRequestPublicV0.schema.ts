import { z } from "zod";
import { latLonSchema } from "../../../../../../shared/latLon";
import { romeCodeSchema } from "../../../../../../shared/rome";
import { siretSchema } from "../../../../../../shared/siret";
import { SearchImmersionRequestPublicV0 } from "./SearchImmersionRequestPublicV0.dto";

export const searchImmersionRequestSchemaPublivV0: z.Schema<SearchImmersionRequestPublicV0> =
  z.object({
    rome: romeCodeSchema.optional(),
    siret: siretSchema.optional(),
    location: latLonSchema,
    distance_km: z.number().positive("'distance_km' doit être > 0"),
  });
