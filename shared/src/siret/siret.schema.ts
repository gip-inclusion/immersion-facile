import { z } from "zod";
import { zString } from "../zodUtils";
import { nafSchema } from "../naf";
import {
  GetSiretInfo,
  GetSiretRequestDto,
  EstablishmentFromSirenApiDto,
  SiretDto,
  siretInfoErrors,
  siretRegex,
} from "./siret";

const normalizeSiret = (siret: string): string => siret.replace(/\s/g, "");

export const siretSchema: z.Schema<SiretDto> = zString
  .regex(siretRegex, "SIRET doit être composé de 14 chiffres")
  .transform(normalizeSiret);

const getSiretResponseSchema: z.Schema<EstablishmentFromSirenApiDto> = z.object(
  {
    siret: siretSchema,
    businessName: z.string(),
    businessAddress: z.string(),
    naf: nafSchema.optional(),
    // true if the office is currently open for business.
    isOpen: z.boolean(),
  },
);

export const getSiretInfoSchema: z.Schema<GetSiretInfo> = z.union([
  getSiretResponseSchema,
  z.enum(siretInfoErrors),
]);
export const isSiretExistResponseSchema: z.Schema<boolean> = z.boolean();
export const getSiretRequestSchema: z.Schema<GetSiretRequestDto> = z.object({
  siret: siretSchema,
  includeClosedEstablishments: z.boolean().optional(),
});
