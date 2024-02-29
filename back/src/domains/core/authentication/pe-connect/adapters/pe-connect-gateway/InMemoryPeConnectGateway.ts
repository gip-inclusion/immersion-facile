import { AccessTokenDto } from "../../dto/AccessToken.dto";
import { PeConnectAdvisorDto } from "../../dto/PeConnectAdvisor.dto";
import { PeConnectUserDto } from "../../dto/PeConnectUser.dto";
import { PeConnectGateway } from "../../port/PeConnectGateway";

export class InMemoryPeConnectGateway implements PeConnectGateway {
  #accessToken: AccessTokenDto | undefined = undefined;

  #advisors: PeConnectAdvisorDto[] = [];

  #user: PeConnectUserDto | undefined = undefined;

  public async getAccessToken(
    _authorizationCode: string,
  ): Promise<AccessTokenDto | undefined> {
    return this.#accessToken;
  }

  public async getUserAndAdvisors(_accessToken: AccessTokenDto): Promise<
    | {
        user: PeConnectUserDto;
        advisors: PeConnectAdvisorDto[];
      }
    | undefined
  > {
    if (!this.#user) return undefined;
    const peUserAndAdvisor: {
      user: PeConnectUserDto;
      advisors: PeConnectAdvisorDto[];
    } = {
      advisors: this.#advisors,
      user: this.#user,
    };
    return peUserAndAdvisor;
  }

  public setAccessToken(accessToken: AccessTokenDto) {
    this.#accessToken = accessToken;
  }

  public setAdvisors(advisors: PeConnectAdvisorDto[]) {
    this.#advisors = advisors;
  }

  // test
  public setUser(user: PeConnectUserDto | undefined) {
    this.#user = user;
  }
}
