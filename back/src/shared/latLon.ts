import { z } from "zod";

export type LatLonDto = z.infer<typeof latLonSchema>;
export const latLonSchema = z.object({
  lat: z
    .number()
    .gte(-90, "'lat' doit être >= -90.0")
    .lte(90, "'lat' doit être <= 90.0"),
  lon: z
    .number()
    .gte(-180, "'lon' doit être >= 180.0")
    .lte(180, "'lon' doit être <= 180.0"),
});

// export type LocationSuggestionDto = z.infer<typeof locationSuggestionSchema>;
// export const locationSuggestionSchema = z.object({
//   coordinates: latLonSchema,
//   label: z.string(),
// });
