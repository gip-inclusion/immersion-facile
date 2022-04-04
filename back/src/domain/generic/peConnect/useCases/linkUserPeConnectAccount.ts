import { z } from "zod";
import { AbsoluteUrl } from "../../../../shared/AbsoluteUrl";
import { frontRoutes } from "../../../../shared/routes";
import { queryParamsAsString } from "../../../../shared/utils/queryParams";
import { UseCase } from "../../../core/UseCase";
import {
  ImmersionApplicationPeConnectFields,
  PeConnectGateway,
  peConnectUserInfoToImmersionApplicationDto,
} from "../port/PeConnectGateway";
import { notifyObjectDiscord } from "../../../../utils/notifyDiscord";
import { GetAccessTokenResponse } from "../../../core/ports/AccessTokenGateway";
import { createAxiosInstance } from "../../../../utils/axiosUtils";
import { secondsToMilliseconds } from "date-fns";

export class LinkUserPeConnectAccount extends UseCase<string, AbsoluteUrl> {
  inputSchema = z.string();

  constructor(
    public readonly peConnectGateway: PeConnectGateway,
    private baseUrl: AbsoluteUrl,
  ) {
    super();
  }

  protected async _execute(authorizationCode: string): Promise<AbsoluteUrl> {
    const peAccessToken =
      await this.peConnectGateway.oAuthGetAccessTokenThroughAuthorizationCode(
        authorizationCode,
      );

    //notifyObjectDiscord({ _message: "PeAccessToken", ...peAccessToken });
    const userInfo = await this.peConnectGateway.getUserInfo(peAccessToken);

    const queryParams =
      queryParamsAsString<ImmersionApplicationPeConnectFields>(
        peConnectUserInfoToImmersionApplicationDto(userInfo),
      );

    const testApiConseiller = this.testApiConseiller(peAccessToken);
    notifyObjectDiscord(testApiConseiller);

    return `${this.baseUrl}/${frontRoutes.immersionApplicationsRoute}?${queryParams}`;
  }

  private async testApiConseiller(peAccessToken: GetAccessTokenResponse) {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${peAccessToken.access_token}`,
    };

    const response = await createAxiosInstance().get(
      "https://api.emploi-store.fr/partenaire/peconnect-conseillers/v1/contactspe/conseillers",
      {
        headers,
        timeout: secondsToMilliseconds(10),
      },
    );

    return response.data;
  }
}
