import { z } from "zod";
import { geoPositionSchema } from "../geoPosition/geoPosition.schema";
import { romeCodeSchema } from "../rome";
import { appellationCodeSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { siretSchema } from "../siret/siret.schema";
import { zString, zStringCanBeEmpty, zStringPossiblyEmpty } from "../zodUtils";
import { SearchImmersionResultDto } from "./SearchImmersionResult.dto";

export const searchImmersionResultSchema: z.Schema<SearchImmersionResultDto> =
  z.object({
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
      departmentCode: zString,
      city: zString,
    }),
    contactMode: z.enum(["EMAIL", "PHONE", "IN_PERSON"]).optional(),
    distance_m: z.number().optional(),
    numberOfEmployeeRange: z.string().optional(),
    website: zStringPossiblyEmpty.optional(),
    additionalInformation: zStringPossiblyEmpty.optional(),
    fitForDisabledWorkers: z.boolean().optional(),
    urlOfPartner: z.string().optional(),
    appellations: z.array(
      z.object({
        appellationLabel: z.string(),
        appellationCode: appellationCodeSchema,
      }),
    ),
  });

export const searchImmersionsSchema = z.array(searchImmersionResultSchema);
