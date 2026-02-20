import { z } from "zod";
import {
  businessAddressSchema,
  businessNameSchema,
} from "../business/business";
import { nafSchema } from "../naf/naf.schema";
import { removeSpaces } from "../utils/string";
import { zStringMinLength1 } from "../utils/string.schema";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
} from "../zodUtils";
import {
  type GetSiretInfo,
  type GetSiretRequestDto,
  type NumberEmployeesRange,
  numberEmployeesRanges,
  type SiretDto,
  type SiretEstablishmentDto,
  siretInfoErrors,
  siretRegex,
  type WithSiretDto,
} from "./siret";

export const numberOfEmployeesRangeSchema: ZodSchemaWithInputMatchingOutput<NumberEmployeesRange> =
  z.enum(numberEmployeesRanges, {
    error: localization.invalidEnum,
  });

export const siretSchema: ZodSchemaWithInputMatchingOutput<SiretDto> =
  zStringMinLength1
    .regex(siretRegex, {
      error: localization.invalidSiret,
    })
    .transform(removeSpaces);

export const withSiretSchema: ZodSchemaWithInputMatchingOutput<WithSiretDto> =
  z.object({
    siret: siretSchema,
  });

const getSiretResponseSchema: ZodSchemaWithInputMatchingOutput<SiretEstablishmentDto> =
  z.object({
    siret: siretSchema,
    businessName: businessNameSchema,
    businessAddress: businessAddressSchema,
    isOpen: z.boolean(), // true if the office is currently open for business.
    nafDto: nafSchema.optional(),
    numberEmployeesRange: z.enum(numberEmployeesRanges, {
      error: localization.invalidEnum,
    }),
  });

export const getSiretInfoSchema: ZodSchemaWithInputMatchingOutput<GetSiretInfo> =
  z.union([
    getSiretResponseSchema,
    z.enum(siretInfoErrors, {
      error: localization.invalidEnum,
    }),
  ]);
export const isSiretExistResponseSchema: ZodSchemaWithInputMatchingOutput<boolean> =
  z.boolean();
export const getSiretRequestSchema: ZodSchemaWithInputMatchingOutput<GetSiretRequestDto> =
  z.object({
    siret: siretSchema,
    includeClosedEstablishments: z.boolean().optional(),
  });
