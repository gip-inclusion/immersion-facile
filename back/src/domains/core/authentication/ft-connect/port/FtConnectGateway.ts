import { AccessTokenDto } from "../dto/AccessToken.dto";
import { FtConnectAdvisorDto } from "../dto/FtConnectAdvisor.dto";
import { FtConnectUserDto } from "../dto/FtConnectUserDto";

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
}
