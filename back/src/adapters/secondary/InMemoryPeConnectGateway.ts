import { GetAccessTokenResponse } from "../../domain/core/ports/AccessTokenGateway";
import { AbsoluteUrl } from "../../shared/AbsoluteUrl";
import { frontRoutes } from "../../shared/routes";
import {
  ImmersionApplicationPeConnectFields,
  PeConnectGateway,
  PeConnectUserInfo,
  peConnectUserInfoToImmersionApplicationDto,
} from "../../domain/generic/peConnect/port/PeConnectGateway";
import { queryParamsAsString } from "../../shared/utils/queryParams";

export class InMemoryPeConnectGateway implements PeConnectGateway {
  constructor(private baseUrl: AbsoluteUrl) {}

  async oAuthGetAccessTokenThroughAuthorizationCode(
    _authorizationCode: string,
  ): Promise<GetAccessTokenResponse> {
    return {
      access_token: "ejhlgjdkljeklgjlkjekljzklejekljsklfj",
      expires_in: 59,
    } as GetAccessTokenResponse;
  }

  // This mocks the full external flow and not only the first redirect on https://authentification-candidat.pole-emploi.fr/connexion/oauth2/authorize
  oAuthGetAuthorizationCodeRedirectUrl(): AbsoluteUrl {
    /*
     * mocking full external oath2 flow with authorization_code grant type
     * First we would log into the external entity account and receive an authorization code.
     * We would then exchange this code against an access token
     * This token let us call the api user authenticated routes to get its data
     */
    const mockedUserInfo: PeConnectUserInfo = {
      sub: "749dd14f-c82a-48b1-b1bb-fffc5467e4d4",
      gender: "male",
      family_name: "John",
      given_name: "Doe",
      email: "john.doe@gmail.com",
      idIdentiteExterne: "749dd14f-c82a-48b1-b1bb-fffc5467e4d4",
    };

    //We would then be redirected on our /demande-immersion url with the associated urlencoded payload

    const queryParams =
      queryParamsAsString<ImmersionApplicationPeConnectFields>(
        peConnectUserInfoToImmersionApplicationDto(mockedUserInfo),
      );

    return `${this.baseUrl}/${frontRoutes.immersionApplicationsRoute}?${queryParams}`;
  }

  async getUserInfo(
    _accesstoken: GetAccessTokenResponse,
  ): Promise<PeConnectUserInfo> {
    return {
      sub: "749dd14f-c82a-48b1-b1bb-fffc5467e4d4",
      gender: "male",
      family_name: "John",
      given_name: "Doe",
      email: "john.doe@gmail.com",
      idIdentiteExterne: "749dd14f-c82a-48b1-b1bb-fffc5467e4d4",
    };
  }
}
