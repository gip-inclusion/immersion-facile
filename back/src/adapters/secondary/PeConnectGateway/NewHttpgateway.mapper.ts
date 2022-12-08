import { AccessTokenDto } from "../../../domain/peConnect/dto/AccessToken.dto";
import { AllPeConnectAdvisorDto } from "../../../domain/peConnect/dto/PeConnectAdvisor.dto";
import { PeConnectUserDto } from "../../../domain/peConnect/dto/PeConnectUser.dto";
import {
  ExternalAccessToken,
  ExternalPeConnectAdvisor,
  ExternalPeConnectUser,
} from "./PeConnectApi";

export const toPeConnectAdvisorDto = (
  fromApi: ExternalPeConnectAdvisor,
): AllPeConnectAdvisorDto => ({
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
