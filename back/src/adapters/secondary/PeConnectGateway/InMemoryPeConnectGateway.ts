import { AccessTokenDto } from "../../../domain/peConnect/dto/AccessToken.dto";
import { AllPeConnectAdvisorDto } from "../../../domain/peConnect/dto/PeConnectAdvisor.dto";
import { PeConnectUserDto } from "../../../domain/peConnect/dto/PeConnectUser.dto";
import { PeConnectGateway } from "../../../domain/peConnect/port/PeConnectGateway";

export class InMemoryPeConnectGateway implements PeConnectGateway {
  public async getAccessToken(
    _authorizationCode: string,
  ): Promise<AccessTokenDto | undefined> {
    return this._accessToken;
  }

  public async getUserAndAdvisors(_accessToken: AccessTokenDto): Promise<{
    user: PeConnectUserDto;
    advisors: AllPeConnectAdvisorDto[];
  }> {
    if (!this._user) throw new Error("No user on gateway.");
    const peUserAndAdvisor: {
      user: PeConnectUserDto;
      advisors: AllPeConnectAdvisorDto[];
    } = {
      advisors: this._advisors,
      user: this._user,
    };
    return peUserAndAdvisor;
  }

  // test
  public setUser(user: PeConnectUserDto) {
    this._user = user;
  }

  public setAdvisors(advisors: AllPeConnectAdvisorDto[]) {
    this._advisors.push(...advisors);
  }

  public setAccessToken(accessToken: AccessTokenDto) {
    this._accessToken = accessToken;
  }

  private _user: PeConnectUserDto | undefined = undefined;
  private _accessToken: AccessTokenDto | undefined = undefined;
  private _advisors: AllPeConnectAdvisorDto[] = [];
}
