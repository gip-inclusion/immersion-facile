import { AccessTokenDto } from "../../../domain/peConnect/dto/AccessToken.dto";
import { SupportedPeConnectAdvisorDto } from "../../../domain/peConnect/dto/PeConnectAdvisor.dto";
import { PeConnectUserDto } from "../../../domain/peConnect/dto/PeConnectUser.dto";
import {
  ExternalAccessToken,
  ExternalPeConnectAdvisor,
  ExternalPeConnectUser,
} from "./PeConnectApi";

export const toPeConnectAdvisorDto = (
  fromApi: ExternalPeConnectAdvisor,
): SupportedPeConnectAdvisorDto => ({
  email: fromApi.mail,
  firstName: fromApi.prenom,
  lastName: fromApi.nom,
  type: fromApi.type,
});

export const toPeConnectUserDto = (
  fromApi: ExternalPeConnectUser,
): PeConnectUserDto => ({
  email: fromApi.email,
  firstName: fromApi.given_name,
  lastName: fromApi.family_name,
  peExternalId: fromApi.idIdentiteExterne,
});

export const toAccessToken = (
  externalAccessToken: ExternalAccessToken,
): AccessTokenDto => ({
  value: externalAccessToken.access_token,
  expiresIn: externalAccessToken.expires_in,
});
