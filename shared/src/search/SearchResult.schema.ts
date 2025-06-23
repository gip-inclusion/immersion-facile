import { z } from "zod/v4";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { geoPositionSchema } from "../geoPosition/geoPosition.schema";
import { romeCodeSchema } from "../rome";
import { appellationCodeSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { siretSchema } from "../siret/siret.schema";
import { dateTimeIsoStringSchema } from "../utils/date";
import { localization, zStringCanBeEmpty, zStringMinLength1, zUuidLike } from "../zodUtils";
import type { SearchResultDto } from "./SearchResult.dto";

export const searchResultSchema: z.Schema<SearchResultDto> = z.object({
  rome: romeCodeSchema,
  romeLabel: z.string(),
  naf: z.string(),
  nafLabel: z.string(),
  siret: siretSchema,
  establishmentScore: z.number(),
  name: z.string(),
  customizedName: z.string().optional(),
  voluntaryToImmersion: z.boolean(),
  position: geoPositionSchema,
  address: z.object({
    streetNumberAndAddress: zStringCanBeEmpty,
    postcode: zStringCanBeEmpty,
    departmentCode: zStringMinLength1,
    city: zStringMinLength1,
  }),
  contactMode: z.enum(["EMAIL", "PHONE", "IN_PERSON"], {
    error: localization.invalidEnum,
  }).optional(),
  distance_m: z.number().optional(),
  numberOfEmployeeRange: z.string().optional(),
  website: absoluteUrlSchema.or(z.literal("")).optional(),
  additionalInformation: zStringCanBeEmpty.optional(),
  fitForDisabledWorkers: z.boolean().optional(),
  urlOfPartner: z.string().optional(),
  appellations: z.array(
    z.object({
      appellationLabel: z.string(),
      appellationCode: appellationCodeSchema,
    }),
  ),
  updatedAt: dateTimeIsoStringSchema.optional(),
  createdAt: dateTimeIsoStringSchema.optional(),
  // locationId: zUuidLike,
  locationId: zUuidLike.or(z.null()),
});

export const searchResultsSchema = z.array(searchResultSchema);
