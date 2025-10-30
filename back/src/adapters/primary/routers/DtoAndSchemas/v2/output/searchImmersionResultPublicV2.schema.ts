import {
  absoluteUrlSchema,
  appellationCodeSchema,
  dateTimeIsoStringSchema,
  geoPositionSchema,
  localization,
  romeCodeSchema,
  siretSchema,
  type ZodSchemaWithInputMatchingOutput,
  zStringCanBeEmpty,
  zStringMinLength1,
  zUuidLike,
} from "shared";
import { z } from "zod";
import type { SearchImmersionResultPublicV2 } from "./SearchImmersionResultPublicV2.dto";

export const searchResultPublicV2Schema: ZodSchemaWithInputMatchingOutput<SearchImmersionResultPublicV2> =
  z.object({
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
    contactMode: z
      .enum(["EMAIL", "PHONE", "IN_PERSON"], {
        error: localization.invalidEnum,
      })
      .optional(),
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
    locationId: zUuidLike.or(z.null()),
  });
