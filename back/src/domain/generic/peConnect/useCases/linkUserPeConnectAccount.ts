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

export class LinkUserPeConnectAccount extends UseCase<string, AbsoluteUrl> {
  inputSchema = z.string();

  constructor(
    public readonly peConnectGateway: PeConnectGateway,
    private baseUrl: AbsoluteUrl,
  ) {
    super();
  }

  protected async _execute(authorizationCode: string): Promise<AbsoluteUrl> {
    notifyObjectDiscord(authorizationCode);

    const peAccessToken =
      await this.peConnectGateway.oAuthGetAccessTokenThroughAuthorizationCode(
        authorizationCode,
      );

    notifyObjectDiscord(authorizationCode);
    const userInfo = await this.peConnectGateway.getUserInfo(peAccessToken);

    notifyObjectDiscord(userInfo);

    const queryParams =
      queryParamsAsString<ImmersionApplicationPeConnectFields>(
        peConnectUserInfoToImmersionApplicationDto(userInfo),
      );

    return `${this.baseUrl}/${frontRoutes.immersionApplicationsRoute}?${queryParams}`;
  }
}
