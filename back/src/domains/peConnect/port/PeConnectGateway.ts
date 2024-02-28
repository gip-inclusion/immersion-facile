import { AccessTokenDto } from "../dto/AccessToken.dto";
import { PeConnectAdvisorDto } from "../dto/PeConnectAdvisor.dto";
import { PeConnectUserDto } from "../dto/PeConnectUser.dto";

export interface PeConnectGateway {
  getAccessToken(
    authorizationCode: string,
  ): Promise<AccessTokenDto | undefined>;
  getUserAndAdvisors(accessToken: AccessTokenDto): Promise<
    | {
        user: PeConnectUserDto;
        advisors: PeConnectAdvisorDto[];
      }
    | undefined
  >;
}
