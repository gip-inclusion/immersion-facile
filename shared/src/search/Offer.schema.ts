import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { fitForDisabledWorkersSchema } from "../formEstablishment/FormEstablishment.schema";
import { geoPositionSchema } from "../geoPosition/geoPosition.schema";
import { createPaginatedSchema } from "../pagination/pagination.schema";
import { romeCodeSchema } from "../rome";
import { appellationCodeSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { siretSchema } from "../siret/siret.schema";
import { dateTimeIsoStringSchema } from "../utils/date";
import { zStringCanBeEmpty, zStringMinLength1 } from "../utils/string.schema";
import { zUuidLike } from "../utils/uuid";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
  zBoolean,
} from "../zodUtils";
import type {
  ExternalOfferDto,
  InternalOfferDto,
  UrlOfParner,
} from "./Offer.dto";
import { remoteWorkModeSchema } from "./SearchQueryParams.schema";

const withRemoteWorkModeSchema = z.object({
  remoteWorkMode: remoteWorkModeSchema,
});

const urlOfPartnerSchema: ZodSchemaWithInputMatchingOutput<UrlOfParner> =
  zStringCanBeEmpty;

const commonOfferSchema = z.object({
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
  fitForDisabledWorkers: fitForDisabledWorkersSchema.nullable(),
  urlOfPartner: urlOfPartnerSchema.optional(),
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

export const internalOfferSchema: ZodSchemaWithInputMatchingOutput<InternalOfferDto> =
  commonOfferSchema.extend(withRemoteWorkModeSchema.shape).extend({
    isAvailable: zBoolean,
  });

export const externalOfferSchema: ZodSchemaWithInputMatchingOutput<ExternalOfferDto> =
  commonOfferSchema;

export const externalSearchResultsSchema = z.array(externalOfferSchema);

export const paginatedSearchResultsSchema =
  createPaginatedSchema(internalOfferSchema);
