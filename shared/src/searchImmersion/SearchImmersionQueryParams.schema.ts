import { z } from "zod";
import { appellationSchema, romeCodeSchema } from "../rome";
import { siretSchema } from "../siret/siret.schema";
import { zToBoolean, zToNumber } from "../zodUtils";
import { SearchImmersionQueryParamsDto } from "./SearchImmersionQueryParams.dto";

export const searchImmersionQueryParamsSchema: z.Schema<SearchImmersionQueryParamsDto> =
  z.object({
    rome: romeCodeSchema.optional(),
    appellationCode: appellationSchema.optional(),
    siret: siretSchema.optional(),
    latitude: zToNumber,
    longitude: zToNumber,
    distanceKm: zToNumber.positive("'distance_km' doit être > 0").max(100),
    voluntaryToImmersion: zToBoolean.optional(),
    place: z.string().optional(),
    sortedBy: z.enum(["distance", "date"]).optional(),
  });
