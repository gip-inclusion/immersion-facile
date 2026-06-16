import type { AbsoluteUrl, WithIdToken } from "shared";
import type {
  GetAccessTokenParams,
  GetAccessTokenResult,
  GetLoginUrlParams,
  OAuthGateway,
} from "../../connected-user/port/OAuthGateway";
import type { AccessTokenDto } from "../dto/AccessToken.dto";
import type { FtConnectAdvisorDto } from "../dto/FtConnectAdvisor.dto";
import type { FtConnectUserDto } from "../dto/FtConnectUserDto";

export interface FtConnectGateway extends OAuthGateway {
  getLoginUrl(params: GetLoginUrlParams): Promise<AbsoluteUrl>;
  getAccessToken(params: GetAccessTokenParams): Promise<GetAccessTokenResult>;
  getUserAndAdvisors(accessToken: AccessTokenDto): Promise<
    | {
        user: FtConnectUserDto;
        advisors: FtConnectAdvisorDto[];
      }
    | undefined
  >;
  getLogoutUrl({ idToken }: WithIdToken): Promise<AbsoluteUrl>;
}
