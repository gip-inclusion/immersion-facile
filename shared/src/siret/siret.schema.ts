import { z } from "zod";
import { nafSchema } from "../naf";
import { removeSpaces } from "../utils/string";
import { zStringMinLength1 } from "../zodUtils";
import {
  GetSiretInfo,
  GetSiretRequestDto,
  NumberEmployeesRange,
  SiretDto,
  SiretEstablishmentDto,
  WithSiretDto,
  numberEmployeesRanges,
  siretInfoErrors,
  siretRegex,
} from "./siret";

export const numberOfEmployeesRangeSchema: z.Schema<NumberEmployeesRange> =
  z.enum(numberEmployeesRanges);

export const siretSchema: z.Schema<SiretDto> = zStringMinLength1
  .refine(
    (siret) => siret.match(siretRegex),
    "SIRET doit être composé de 14 chiffres",
  )
  .transform(removeSpaces);

export const withSiretSchema: z.Schema<WithSiretDto> = z.object({
  siret: siretSchema,
});

const getSiretResponseSchema: z.Schema<SiretEstablishmentDto> = z.object({
  siret: siretSchema,
  businessName: z.string(),
  businessAddress: z.string(),
  isOpen: z.boolean(), // true if the office is currently open for business.
  nafDto: nafSchema.optional(),
  numberEmployeesRange: z.enum(numberEmployeesRanges),
});

export const getSiretInfoSchema: z.Schema<GetSiretInfo> = z.union([
  getSiretResponseSchema,
  z.enum(siretInfoErrors),
]);
export const isSiretExistResponseSchema: z.Schema<boolean> = z.boolean();
export const getSiretRequestSchema: z.Schema<GetSiretRequestDto> = z.object({
  siret: siretSchema,
  includeClosedEstablishments: z.boolean().optional(),
});
