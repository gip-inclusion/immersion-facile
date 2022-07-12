import { z } from "zod";
import { nafSchema } from "./naf";
import { Flavor } from "./typeFlavors";
import { zString } from "./zodUtils";

const normalizeSiret = (siret: string): string => siret.replace(/\s/g, "");

// Matches strings containing exactly 14 digits with any number of interspersed whitespaces.
const siretRegex = /^(?:\s*\d){14}\s*$/;

export const tooManySirenRequestsSiret = "42900000000429";
export const conflictErrorSiret = "40900000000409";
export const apiSirenNotAvailableSiret = "50300000000503";
export const apiSirenUnexpectedError = "66600666600666";

export const tooManiSirenRequestsSiretErrorMessage =
  "Too many requests on SIRENE API.";
export const sirenApiUnavailableSiretErrorMessage = "SIRENE API not available.";
export const sirenApiUnexpectedErrorErrorMessage = "Unexpected Error";
export const sirenApiMissingEstablishmentMessage =
  "Missing establishment on SIRENE API.";
const siretInfoErrors = [
  tooManiSirenRequestsSiretErrorMessage,
  sirenApiUnavailableSiretErrorMessage,
  sirenApiMissingEstablishmentMessage,
  "Establishment with this siret is already in our DB",
] as const;

export type SiretDto = Flavor<string, "SiretDto">;
export const siretSchema: z.Schema<SiretDto> = zString
  .regex(siretRegex, "SIRET doit être composé de 14 chiffres")
  .transform(normalizeSiret);

export type GetSiretResponseDto = z.infer<typeof getSiretResponseSchema>;
export const getSiretResponseSchema = z.object({
  siret: siretSchema,
  businessName: z.string(),
  businessAddress: z.string(),
  naf: nafSchema.optional(),
  // true if the office is currently open for business.
  isOpen: z.boolean(),
});

export type GetSiretInfoError = typeof siretInfoErrors[number];
export type GetSiretInfo = GetSiretResponseDto | GetSiretInfoError;
export const getSiretInfoError = z.enum(siretInfoErrors);
export const getSiretInfoSchema: z.Schema<GetSiretInfo> = z.union([
  getSiretResponseSchema,
  getSiretInfoError,
]);

export const isSiretExistResponseSchema: z.Schema<boolean> = z.boolean();

export type GetSiretRequestDto = z.infer<typeof getSiretRequestSchema>;
export const getSiretRequestSchema = z.object({
  siret: siretSchema,
  includeClosedEstablishments: z.boolean().optional(),
});
