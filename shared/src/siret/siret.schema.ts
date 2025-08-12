import { z } from "zod/v4";
import { businessNameSchema } from "../business/business";
import { nafSchema } from "../naf/naf.schema";
import { removeSpaces } from "../utils/string";
import { localization, zStringMinLength1 } from "../zodUtils";
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

export const numberOfEmployeesRangeSchema: z.Schema<NumberEmployeesRange> =
  z.enum(numberEmployeesRanges, {
    error: localization.invalidEnum,
  });

export const siretSchema: z.Schema<SiretDto> = zStringMinLength1
  .regex(siretRegex, "SIRET doit être composé de 14 chiffres")
  .transform(removeSpaces);

export const withSiretSchema: z.Schema<WithSiretDto> = z.object({
  siret: siretSchema,
});

const getSiretResponseSchema: z.Schema<SiretEstablishmentDto> = z.object({
  siret: siretSchema,
  businessName: businessNameSchema,
  businessAddress: z.string(),
  isOpen: z.boolean(), // true if the office is currently open for business.
  nafDto: nafSchema.optional(),
  numberEmployeesRange: z.enum(numberEmployeesRanges, {
    error: localization.invalidEnum,
  }),
});

export const getSiretInfoSchema: z.Schema<GetSiretInfo> = z.union([
  getSiretResponseSchema,
  z.enum(siretInfoErrors, {
    error: localization.invalidEnum,
  }),
]);
export const isSiretExistResponseSchema: z.Schema<boolean> = z.boolean();
export const getSiretRequestSchema: z.Schema<GetSiretRequestDto> = z.object({
  siret: siretSchema,
  includeClosedEstablishments: z.boolean().optional(),
});
