import { z } from "zod";
import {
  immersionContactInEstablishmentIdSchema,
  preferredContactMethodSchema,
} from "./FormEstablishmentDto";
import { nafDivisionSchema } from "./naf";
import { siretSchema } from "./siret";
import { romeCodeMetierSchema } from "./rome";
import { Flavor } from "./typeFlavors";
import { zTrimmedString } from "./zodUtils";

export type CompanyId = Flavor<string, "CompanyId">;

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

export type LocationSuggestionDto = z.infer<typeof locationSuggestionSchema>;
export const locationSuggestionSchema = z.object({
  coordinates: latLonSchema,
  label: z.string(),
});

export type SearchImmersionRequestDto = z.infer<
  typeof searchImmersionRequestSchema
>;
export const searchImmersionRequestSchema = z.object({
  rome: romeCodeMetierSchema,
  nafDivision: nafDivisionSchema.optional(),
  siret: siretSchema.optional(),
  location: latLonSchema,
  distance_km: z.number().positive("'distance_km' doit être > 0"),
});

export type SearchContact = z.infer<typeof contactSchema>;
export const contactSchema = z.object({
  id: immersionContactInEstablishmentIdSchema,
  lastName: z.string(),
  firstName: z.string(),
  email: z.string(),
  role: z.string(),
  phone: z.string(),
});

// prettier-ignore
export type ImmersionOfferId = Flavor<string, "ImmersionOfferId">;
export const immersionOfferIdSchema: z.ZodSchema<ImmersionOfferId> =
  zTrimmedString;

export type SearchImmersionResultDto = z.infer<
  typeof searchImmersionResultSchema
>;
export const searchImmersionResultSchema = z.object({
  id: immersionOfferIdSchema,
  rome: z.string(),
  romeLabel: z.string(),
  naf: z.string(),
  nafLabel: z.string(),
  siret: z.string(),
  name: z.string(),
  voluntaryToImmersion: z.boolean(),
  location: latLonSchema,
  address: z.string(),
  city: z.string(),
  contactMode: preferredContactMethodSchema.optional(),
  distance_m: z.number().optional(),
  contactDetails: contactSchema.optional(),
});

export const searchImmersionResponseSchema = z.array(
  searchImmersionResultSchema,
);
