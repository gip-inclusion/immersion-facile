import { AccessTokenDto } from "../../../domain/peConnect/dto/AccessToken.dto";
import { PeConnectAdvisorDto } from "../../../domain/peConnect/dto/PeConnectAdvisor.dto";
import { PeConnectUserDto } from "../../../domain/peConnect/dto/PeConnectUser.dto";
import {
  ExternalPeConnectAdvisor,
  ExternalPeConnectUser,
  ExternalAccessToken,
} from "./peConnectApi.dto";

export const toPeConnectAdvisorDto = (
  fromApi: ExternalPeConnectAdvisor,
): PeConnectAdvisorDto => ({
  email: fromApi.mail,
  firstName: fromApi.prenom,
  lastName: fromApi.nom,
  type: fromApi.type,
});

export const toPeConnectUserDto = (
  externalPeConnectUser: ExternalPeConnectUser & { isUserJobseeker: boolean },
): PeConnectUserDto => ({
  isJobseeker: externalPeConnectUser.isUserJobseeker,
  email: externalPeConnectUser.email,
  firstName: externalPeConnectUser.given_name,
  lastName: externalPeConnectUser.family_name,
  peExternalId: externalPeConnectUser.idIdentiteExterne,
});

export const toAccessToken = (
  externalAccessToken: ExternalAccessToken,
): AccessTokenDto => ({
  value: externalAccessToken.access_token,
  expiresIn: externalAccessToken.expires_in,
});
