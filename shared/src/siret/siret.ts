import { NafDto } from "../naf";
import { Flavor } from "../typeFlavors";

// Matches strings containing exactly 14 digits with any number of interspersed whitespaces.
export const siretRegex = /^(?:\s*\d){14}\s*$/;

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
export const siretInfoErrors = [
  tooManiSirenRequestsSiretErrorMessage,
  sirenApiUnavailableSiretErrorMessage,
  sirenApiMissingEstablishmentMessage,
  "Establishment with this siret is already in our DB",
] as const;

export type SiretDto = Flavor<string, "SiretDto">;
export type GetSiretResponseDto = {
  siret: SiretDto;
  businessName: string;
  businessAddress: string;
  naf?: NafDto;
  // true if the office is currently open for business.
  isOpen: boolean;
};
export type GetSiretInfoError = (typeof siretInfoErrors)[number];
export type GetSiretInfo = GetSiretResponseDto | GetSiretInfoError;
export type GetSiretRequestDto = {
  siret: SiretDto;
  includeClosedEstablishments?: boolean;
};
