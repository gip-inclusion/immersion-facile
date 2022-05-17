import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { frontRoutes } from "shared/src/routes";
import { queryParamsAsString } from "shared/src/utils/queryParams";
import {
  AccessToken,
  externalAccessTokenSchema,
  externalPeConnectAdvisorsSchema,
  ExternalPeConnectUser,
  externalPeConnectUserSchema,
  ImmersionApplicationPeConnectFields,
  PeUserAndAdvisors,
  PeConnectAdvisorDTO,
  PeConnectGateway,
  PeConnectUserDTO,
  peConnectUserInfoToImmersionApplicationDto,
  toAccessToken,
  toPeConnectAdvisorDTO,
  toPeConnectUserDTO,
  ExternalPeConnectAdvisor,
} from "../../domain/peConnect/port/PeConnectGateway";

export class InMemoryPeConnectGateway implements PeConnectGateway {
  private _user: ExternalPeConnectUser = {
    default: "this should have been erased",
  } as unknown as ExternalPeConnectUser;

  private _advisors: ExternalPeConnectAdvisor[] = [];

  constructor(private baseUrl: AbsoluteUrl) {}

  async oAuthGetAccessTokenThroughAuthorizationCode(
    _authorizationCode: string,
  ): Promise<AccessToken> {
    return toAccessToken(
      externalAccessTokenSchema.parse({
        access_token: "ejhlgjdkljeklgjlkjekljzklejekljsklfj",
        expires_in: 59,
      }),
    );
  }

  // This mocks the full external flow and not only the first redirect on https://authentification-candidat.pole-emploi.fr/connexion/oauth2/authorize
  oAuthGetAuthorizationCodeRedirectUrl(): AbsoluteUrl {
    /*
     * mocking full external oath2 flow with authorization_code grant type
     * First we would log into the external entity account and receive an authorization code.
     * We would then exchange this code against an access token
     * This token let us call the api user authenticated routes to get its data
     */
    const mockedUserInfo: ExternalPeConnectUser =
      externalPeConnectUserSchema.parse({
        sub: "749dd14f-c82a-48b1-b1bb-fffc5467e4d4",
        gender: "male",
        family_name: "John",
        given_name: "Doe",
        email: "john.doe@gmail.com",
        idIdentiteExterne: "749dd14f-c82a-48b1-b1bb-fffc5467e4d4",
      });

    //We would then be redirected on our /demande-immersion url with the associated urlencoded payload

    const queryParams =
      queryParamsAsString<ImmersionApplicationPeConnectFields>(
        peConnectUserInfoToImmersionApplicationDto(
          toPeConnectUserDTO(mockedUserInfo),
        ),
      );

    return `${this.baseUrl}/${frontRoutes.immersionApplicationsRoute}?${queryParams}`;
  }

  async getAdvisorsInfo(
    _accesstoken: AccessToken,
  ): Promise<PeConnectAdvisorDTO[]> {
    const externalMockedAdvisors = externalPeConnectAdvisorsSchema.parse(
      this._advisors,
    );

    return externalMockedAdvisors.map(toPeConnectAdvisorDTO);
  }

  async getUserInfo(_accesstoken: AccessToken): Promise<PeConnectUserDTO> {
    const mockedExternaluser: ExternalPeConnectUser =
      externalPeConnectUserSchema.parse(this._user);

    return toPeConnectUserDTO(mockedExternaluser);
  }

  async getUserAndAdvisors(
    _authorizationCode: string,
  ): Promise<PeUserAndAdvisors> {
    return {
      user: await this.getUserInfo({} as AccessToken),
      advisors: await this.getAdvisorsInfo({} as AccessToken),
    };
  }

  //private _infos: PeUserAndAdvisors = { default: "this should have been erased"} as unknown as PeUserAndAdvisors;

  // test
  public setUser(user: ExternalPeConnectUser) {
    this._user = user;
  }

  setAdvisors(advisors: ExternalPeConnectAdvisor[]) {
    this._advisors.push(...advisors);
  }
}
