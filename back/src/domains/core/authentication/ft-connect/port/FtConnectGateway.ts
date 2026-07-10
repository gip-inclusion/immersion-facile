import type { OAuthGateway } from "../../connected-user/port/OAuthGateway";
import type { AccessTokenDto } from "../dto/AccessToken.dto";
import type { FtConnectAdvisorDto } from "../dto/FtConnectAdvisor.dto";
import type { FtConnectUserDto } from "../dto/FtConnectUserDto";

export interface FtConnectGateway extends OAuthGateway {
  getUserAndAdvisors(accessToken: AccessTokenDto): Promise<
    | {
        user: FtConnectUserDto;
        advisors: FtConnectAdvisorDto[];
      }
    | undefined
  >;
}
