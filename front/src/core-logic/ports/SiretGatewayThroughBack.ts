import { Observable } from "rxjs";
import { SiretDto, GetSiretResponseDto } from "shared/src/siret";

export const tooManiSirenRequestsSiretErrorMessage =
  "Too many requests on SIRENE API.";
export const sirenApiUnavailableSiretErrorMessage = "SIRENE API not available.";
export const sirenApiUnexpectedErrorErrorMessage = "Unexpected Error";
export const sirenApiMissingEstablishmentMessage =
  "Missing establishment on SIRENE API.";
export type GetSiretInfoError =
  | typeof sirenApiMissingEstablishmentMessage
  | typeof tooManiSirenRequestsSiretErrorMessage
  | typeof sirenApiUnavailableSiretErrorMessage
  | "Establishment with this siret is already in our DB";

export type GetSiretInfo = GetSiretResponseDto | GetSiretInfoError;

export interface SiretGatewayThroughBack {
  getSiretInfo: (siret: SiretDto) => Promise<GetSiretInfo>;
  getSiretInfoObservable: (siret: SiretDto) => Observable<GetSiretInfo>;
  getSiretInfoIfNotAlreadySaved: (siret: SiretDto) => Observable<GetSiretInfo>;
}
