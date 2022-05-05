import { SiretDto, GetSiretResponseDto } from "src/shared/siret";

export const tooManiSirenRequestsSiretErrorMessage =
  "Too many requests on SIRENE API.";
export const sirenApiUnavailableSiretErrorMessage = "SIRENE API not available.";
export const sirenApiUnexpectedErrorErrorMessage = "Unexpected Error";
export const sirenApiMissingEstablishmentMessage =
  "Missing establishment on SIRENE API.";
export type GetSiretInfoError =
  | typeof sirenApiMissingEstablishmentMessage
  | typeof tooManiSirenRequestsSiretErrorMessage
  | typeof sirenApiUnavailableSiretErrorMessage;

export type GetSiretInfo = GetSiretResponseDto | GetSiretInfoError;

export interface SiretGatewayThroughBack {
  getSiretInfo: (siret: SiretDto) => Promise<GetSiretInfo>;
}
