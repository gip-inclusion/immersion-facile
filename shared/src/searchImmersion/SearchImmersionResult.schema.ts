import { z } from "zod";
import { ImmersionOfferId } from "../ImmersionOfferId";
import { latLonSchema } from "../latLon";
import { romeCodeSchema } from "../rome";
import { siretSchema } from "../siret";
import { zTrimmedString } from "../zodUtils";
import {
  SearchContactDto,
  SearchImmersionResultDto,
} from "./SearchImmersionResult.dto";

export const immersionOfferIdSchema: z.ZodSchema<ImmersionOfferId> =
  zTrimmedString;

export const contactDetailsSchema: z.Schema<SearchContactDto> = z.object({
  id: z.string(),
  lastName: z.string(),
  firstName: z.string(),
  email: z.string(),
  job: z.string(),
  phone: z.string(),
});

export const searchImmersionResultSchema: z.Schema<SearchImmersionResultDto> =
  z.object({
    rome: romeCodeSchema,
    romeLabel: z.string(),
    appellationLabels: z.array(z.string()),
    naf: z.string(),
    nafLabel: z.string(),
    siret: siretSchema,
    name: z.string(),
    customizedName: z.string().optional(),
    voluntaryToImmersion: z.boolean(),
    location: latLonSchema,
    address: z.string(),
    city: z.string(),
    contactMode: z.enum(["EMAIL", "PHONE", "IN_PERSON"]).optional(),
    distance_m: z.number().optional(),
    contactDetails: contactDetailsSchema.optional(),
    numberOfEmployeeRange: z.string().optional(),
  });

export const searchImmersionResponseSchema = z.array(
  searchImmersionResultSchema,
);
