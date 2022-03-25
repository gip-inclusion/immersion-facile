import { z } from "zod";
import { latLonSchema } from "../latLon";
import { romeCodeSchema } from "../rome";
import { siretSchema } from "../siret";
import { zTrimmedString } from "../zodUtils";
import {
  SearchContactDto,
  SearchImmersionResultDto,
} from "./SearchImmersionResult.dto";

export const immersionOfferIdSchema: z.ZodSchema<string> = zTrimmedString;

export const searchContactSchema: z.Schema<SearchContactDto> = z.object({
  id: z.string(),
  lastName: z.string(),
  firstName: z.string(),
  email: z.string(),
  role: z.string(),
  phone: z.string(),
});

export const searchImmersionResultSchema: z.Schema<SearchImmersionResultDto> =
  z.object({
    id: immersionOfferIdSchema,
    rome: romeCodeSchema,
    romeLabel: z.string(),
    naf: z.string(),
    nafLabel: z.string(),
    siret: siretSchema,
    name: z.string(),
    voluntaryToImmersion: z.boolean(),
    location: latLonSchema,
    address: z.string(),
    city: z.string(),
    contactMode: z.enum(["EMAIL", "PHONE", "IN_PERSON"]).optional(),
    distance_m: z.number().optional(),
    contactDetails: searchContactSchema.optional(),
    numberOfEmployeeRange: z.string().optional(),
  });

export const searchImmersionResponseSchema = z.array(
  searchImmersionResultSchema,
);
