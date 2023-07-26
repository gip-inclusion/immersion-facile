import { AccessTokenDto } from "../../../domain/peConnect/dto/AccessToken.dto";
import { PeConnectAdvisorDto } from "../../../domain/peConnect/dto/PeConnectAdvisor.dto";
import { PeConnectUserDto } from "../../../domain/peConnect/dto/PeConnectUser.dto";
import { PeConnectGateway } from "../../../domain/peConnect/port/PeConnectGateway";

export class InMemoryPeConnectGateway implements PeConnectGateway {
  private _accessToken: AccessTokenDto | undefined = undefined;

  private _advisors: PeConnectAdvisorDto[] = [];

  private _user: PeConnectUserDto | undefined = undefined;

  public async getAccessToken(
    _authorizationCode: string,
  ): Promise<AccessTokenDto | undefined> {
    return this._accessToken;
  }

  public async getUserAndAdvisors(_accessToken: AccessTokenDto): Promise<
    | {
        user: PeConnectUserDto;
        advisors: PeConnectAdvisorDto[];
      }
    | undefined
  > {
    if (!this._user) return undefined;
    const peUserAndAdvisor: {
      user: PeConnectUserDto;
      advisors: PeConnectAdvisorDto[];
    } = {
      advisors: this._advisors,
      user: this._user,
    };
    return peUserAndAdvisor;
  }

  public setAccessToken(accessToken: AccessTokenDto) {
    this._accessToken = accessToken;
  }

  public setAdvisors(advisors: PeConnectAdvisorDto[]) {
    this._advisors = advisors;
  }

  // test
  public setUser(user: PeConnectUserDto | undefined) {
    this._user = user;
  }
}
