import { z } from "zod";

import { nafSchema } from "../naf";
import { zString } from "../zodUtils";

import {
  GetSiretInfo,
  GetSiretRequestDto,
  numberEmployeesRanges,
  SirenEstablishmentDto,
  SiretDto,
  siretInfoErrors,
  siretRegex,
} from "./siret";

const normalizeSiret = (siret: string): string => siret.replace(/\s/g, "");

export const siretSchema: z.Schema<SiretDto> = zString
  .regex(siretRegex, "SIRET doit être composé de 14 chiffres")
  .transform(normalizeSiret);

const getSiretResponseSchema: z.Schema<SirenEstablishmentDto> = z.object({
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
