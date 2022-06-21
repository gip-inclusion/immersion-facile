import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { peConnect } from "shared/src/routes";
import { queryParamsAsString } from "shared/src/utils/queryParams";
import { AccessTokenDto } from "../../domain/peConnect/dto/AccessToken.dto";
import {
  ExternalPeConnectAdvisor,
  ExternalPeConnectUser,
  PeConnectAdvisorDto,
  PeConnectUserDto,
  PeUserAndAdvisors,
  toPeConnectAdvisorDto,
  toPeConnectUserDto,
} from "../../domain/peConnect/dto/PeConnect.dto";

import {
  externalPeConnectAdvisorsSchema,
  externalPeConnectUserSchema,
} from "../../domain/peConnect/port/PeConnect.schema";
import { PeConnectGateway } from "../../domain/peConnect/port/PeConnectGateway";

export class InMemoryPeConnectGateway implements PeConnectGateway {
  private _user: ExternalPeConnectUser = mockedUser;

  private _advisors: ExternalPeConnectAdvisor[] = [];

  constructor(private baseUrl: AbsoluteUrl) {}

  // This mocks the full external flow and not only the first redirect on https://authentification-candidat.pole-emploi.fr/connexion/oauth2/authorize
  oAuthGetAuthorizationCodeRedirectUrl(): AbsoluteUrl {
    const queryParams = queryParamsAsString<{ code: string }>({
      code: "trust-me-i-am-a-valid-code",
    });

    return `${this.baseUrl}/api/${peConnect}?${queryParams}`;
  }

  async getAdvisorsInfo(
    _accesstoken: AccessTokenDto,
  ): Promise<PeConnectAdvisorDto[]> {
    const externalMockedAdvisors = externalPeConnectAdvisorsSchema.parse(
      this._advisors.length != 0 ? this._advisors : [mockedValidAdvisor],
    );

    return externalMockedAdvisors.map(toPeConnectAdvisorDto);
  }

  async getUserInfo(_accesstoken: AccessTokenDto): Promise<PeConnectUserDto> {
    const mockedExternaluser: ExternalPeConnectUser =
      externalPeConnectUserSchema.parse(this._user);

    return toPeConnectUserDto(mockedExternaluser);
  }

  async getUserAndAdvisors(
    _authorizationCode: string,
  ): Promise<PeUserAndAdvisors> {
    return {
      user: await this.getUserInfo({} as AccessTokenDto),
      advisors: await this.getAdvisorsInfo({} as AccessTokenDto),
    };
  }

  // test
  public setUser(user: ExternalPeConnectUser) {
    this._user = user;
  }

  setAdvisors(advisors: ExternalPeConnectAdvisor[]) {
    this._advisors.push(...advisors);
  }
}

const mockedUser: ExternalPeConnectUser = {
  sub: "749dd14f-c82a-48b1-b1bb-fffc5467e4d4",
  gender: "male",
  family_name: "Doe",
  given_name: "John",
  email: "john.doe@gmail.com",
  idIdentiteExterne: "749dd14f-c82a-48b1-b1bb-fffc5467e4d4",
};

const mockedValidAdvisor: ExternalPeConnectAdvisor = {
  civilite: "2",
  mail: "elsa.oldenburg@pole-emploi.net",
  prenom: "Elsa",
  nom: "Oldenburg",
  type: "CAPEMPLOI",
};
