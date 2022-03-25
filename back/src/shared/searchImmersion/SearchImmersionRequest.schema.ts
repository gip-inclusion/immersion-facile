import { z } from "zod";
import { nafDivisionSchema } from "../naf";
import { siretSchema } from "../siret";
import { romeCodeSchema } from "../rome";
import { latLonSchema } from "../latLon";

export const searchImmersionRequestSchema = z.object({
  rome: romeCodeSchema.optional(),
  nafDivision: nafDivisionSchema.optional(),
  siret: siretSchema.optional(),
  location: latLonSchema,
  distance_km: z.number().positive("'distance_km' doit être > 0"),
});
