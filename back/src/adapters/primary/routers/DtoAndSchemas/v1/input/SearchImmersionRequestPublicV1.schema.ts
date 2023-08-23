import { z } from "zod";
import {
  appellationCodeSchema,
  romeCodeSchema,
  siretSchema,
  zToBoolean,
  zToNumber,
} from "shared";
import { SearchImmersionRequestPublicV1 } from "./SearchImmersionRequestPublicV1dto";

export const searchImmersionRequestPublicV1Schema: z.Schema<SearchImmersionRequestPublicV1> =
  z.object({
    rome: romeCodeSchema.optional(),
    appellationCode: appellationCodeSchema.optional(),
    siret: siretSchema.optional(),
    latitude: zToNumber,
    longitude: zToNumber,
    distance_km: zToNumber.positive("'distance_km' doit être > 0").max(100),
    voluntaryToImmersion: zToBoolean.optional(),
    place: z.string().optional(),
    sortedBy: z.enum(["distance", "date"]).optional(),
  });
