import { AccessTokenDto } from "../../dto/AccessToken.dto";
import { FtConnectAdvisorDto } from "../../dto/FtConnectAdvisor.dto";
import { FtConnectUserDto } from "../../dto/FtConnectUserDto";
import { FtConnectGateway } from "../../port/FtConnectGateway";

export class InMemoryFtConnectGateway implements FtConnectGateway {
  #accessToken: AccessTokenDto | undefined = undefined;

  #advisors: FtConnectAdvisorDto[] = [];

  #user: FtConnectUserDto | undefined = undefined;

  public async getAccessToken(
    _authorizationCode: string,
  ): Promise<AccessTokenDto | undefined> {
    return this.#accessToken;
  }

  public async getUserAndAdvisors(_accessToken: AccessTokenDto): Promise<
    | {
        user: FtConnectUserDto;
        advisors: FtConnectAdvisorDto[];
      }
    | undefined
  > {
    if (!this.#user) return undefined;
    return {
      advisors: this.#advisors,
      user: this.#user,
    };
  }

  public setAccessToken(accessToken: AccessTokenDto) {
    this.#accessToken = accessToken;
  }

  public setAdvisors(advisors: FtConnectAdvisorDto[]) {
    this.#advisors = advisors;
  }

  // test
  public setUser(user: FtConnectUserDto | undefined) {
    this.#user = user;
  }
}
