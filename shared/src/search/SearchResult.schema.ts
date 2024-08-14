import { z } from "zod";
import { geoPositionSchema } from "../geoPosition/geoPosition.schema";
import { romeCodeSchema } from "../rome";
import { appellationCodeSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { siretSchema } from "../siret/siret.schema";
import { dateTimeIsoStringSchema } from "../utils/date";
import { zStringCanBeEmpty, zStringMinLength1, zUuidLike } from "../zodUtils";
import { SearchResultDto } from "./SearchResult.dto";

export const searchResultSchema: z.Schema<SearchResultDto> = z.object({
  rome: romeCodeSchema,
  romeLabel: z.string(),
  naf: z.string(),
  nafLabel: z.string(),
  siret: siretSchema,
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
  contactMode: z.enum(["EMAIL", "PHONE", "IN_PERSON"]).optional(),
  distance_m: z.number().optional(),
  numberOfEmployeeRange: z.string().optional(),
  website: zStringCanBeEmpty.optional(),
  additionalInformation: zStringCanBeEmpty.optional(),
  fitForDisabledWorkers: z.boolean().optional(),
  urlOfPartner: z.string().optional(),
  appellations: z.array(
    z.object({
      appellationLabel: z.string(),
      appellationCode: appellationCodeSchema,
      score: z.number(),
    }),
  ),
  updatedAt: dateTimeIsoStringSchema.optional(),
  createdAt: dateTimeIsoStringSchema,
  // locationId: zUuidLike,
  locationId: zUuidLike.or(z.null()),
});

export const searchResultsSchema = z.array(searchResultSchema);
