import { z } from "zod";
import { nafSchema } from "../naf";
import { removeSpaces } from "../utils/string";
import { zStringMinLength1 } from "../zodUtils";
import {
  GetSiretInfo,
  GetSiretRequestDto,
  SiretDto,
  SiretEstablishmentDto,
  numberEmployeesRanges,
  siretInfoErrors,
  siretRegex,
} from "./siret";

export const siretSchema: z.Schema<SiretDto> = zStringMinLength1
  .regex(siretRegex, "SIRET doit être composé de 14 chiffres")
  .transform(removeSpaces);

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
