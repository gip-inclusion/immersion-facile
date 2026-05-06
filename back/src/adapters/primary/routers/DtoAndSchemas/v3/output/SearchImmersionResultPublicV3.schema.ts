import {
  absoluteUrlSchema,
  appellationCodeSchema,
  appellationLabelSchema,
  businessNameSchema,
  contactModeSchema,
  createPaginatedSchema,
  customizedNameSchema,
  dateTimeIsoStringSchema,
  fitForDisabledWorkersSchema,
  geoPositionSchema,
  nafCodeSchema,
  nafSousClasseLabelSchema,
  numberOfEmployeesRangeSchema,
  remoteWorkModeShape,
  romeCodeSchema,
  romeLabelSchema,
  siretSchema,
  type ZodSchemaWithInputMatchingOutput,
  zBoolean,
  zStringCanBeEmpty,
  zStringCanBeEmptyMax9200,
  zStringMinLength1Max1024,
  zUuidLike,
} from "shared";
import { z } from "zod";
import type { SearchImmersionResultPublicV3 } from "./SearchImmersionResultPublicV3.dto";

const searchImmersionResultPublicV3SchemaCommon = z.object({
  rome: romeCodeSchema,
  romeLabel: romeLabelSchema,
  naf: nafCodeSchema,
  nafLabel: nafSousClasseLabelSchema,
  siret: siretSchema,
  establishmentScore: z.number(),
  name: businessNameSchema,
  customizedName: customizedNameSchema.optional(),
  voluntaryToImmersion: z.boolean(),
  position: geoPositionSchema,
  address: z.object({
    streetNumberAndAddress: zStringCanBeEmpty,
    postcode: zStringCanBeEmpty,
    departmentCode: zStringMinLength1Max1024,
    city: zStringMinLength1Max1024,
  }),
  contactMode: contactModeSchema.optional(),
  distance_m: z.number().optional(),
  numberOfEmployeeRange: numberOfEmployeesRangeSchema,
  website: absoluteUrlSchema.or(z.literal("")).optional(),
  additionalInformation: zStringCanBeEmptyMax9200.optional(),
  fitForDisabledWorkers: fitForDisabledWorkersSchema.nullable(),
  urlOfPartner: zStringCanBeEmpty.optional(),
  appellations: z.array(
    z.object({
      appellationLabel: appellationLabelSchema,
      appellationCode: appellationCodeSchema,
    }),
  ),
  updatedAt: dateTimeIsoStringSchema.optional(),
  createdAt: dateTimeIsoStringSchema.optional(),
  locationId: zUuidLike.or(z.null()),
});

export const searchImmersionResultPublicV3Schema: ZodSchemaWithInputMatchingOutput<SearchImmersionResultPublicV3> =
  searchImmersionResultPublicV3SchemaCommon.extend({
    ...remoteWorkModeShape,
    isAvailable: zBoolean,
  });

export const paginatedSearchResultsPublicV3Schema = createPaginatedSchema(
  searchImmersionResultPublicV3Schema,
);
