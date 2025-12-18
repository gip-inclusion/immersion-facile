import type { AbsoluteUrl, WithIdToken } from "shared";
import type { AccessTokenDto } from "../dto/AccessToken.dto";
import type { FtConnectAdvisorDto } from "../dto/FtConnectAdvisor.dto";
import type { FtConnectUserDto } from "../dto/FtConnectUserDto";

export interface FtConnectGateway {
  getAccessToken(
    authorizationCode: string,
  ): Promise<AccessTokenDto | undefined>;
  getUserAndAdvisors(accessToken: AccessTokenDto): Promise<
    | {
        user: FtConnectUserDto;
        advisors: FtConnectAdvisorDto[];
      }
    | undefined
  >;
  getLogoutUrl({ idToken }: WithIdToken): Promise<AbsoluteUrl>;
}
