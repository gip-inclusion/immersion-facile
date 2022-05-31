import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { AccessTokenDto } from "../dto/AccessToken.dto";
import {
  PeConnectAdvisorDto,
  PeConnectUserDto,
  PeUserAndAdvisors,
} from "../dto/PeConnect.dto";

export interface PeConnectGateway {
  oAuthGetAuthorizationCodeRedirectUrl: () => AbsoluteUrl;
  oAuthGetAccessTokenThroughAuthorizationCode: (
    authorizationCode: string,
  ) => Promise<AccessTokenDto>;

  getUserInfo: (accesstoken: AccessTokenDto) => Promise<PeConnectUserDto>;

  getAdvisorsInfo: (
    accesstoken: AccessTokenDto,
  ) => Promise<PeConnectAdvisorDto[]>;

  getUserAndAdvisors: (authorizationCode: string) => Promise<PeUserAndAdvisors>;
}
