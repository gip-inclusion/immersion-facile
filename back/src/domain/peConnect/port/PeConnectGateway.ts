import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { AccessTokenDto } from "../dto/AccessToken.dto";
import {
  PeConnectAdvisorDTO,
  PeConnectUserDTO,
  PeUserAndAdvisors,
} from "../dto/PeConnect.dto";

export interface PeConnectGateway {
  oAuthGetAuthorizationCodeRedirectUrl: () => AbsoluteUrl;
  oAuthGetAccessTokenThroughAuthorizationCode: (
    authorizationCode: string,
  ) => Promise<AccessTokenDto>;

  getUserInfo: (accesstoken: AccessTokenDto) => Promise<PeConnectUserDTO>;

  getAdvisorsInfo: (
    accesstoken: AccessTokenDto,
  ) => Promise<PeConnectAdvisorDTO[]>;

  getUserAndAdvisors: (authorizationCode: string) => Promise<PeUserAndAdvisors>;
}
