import { UseCase } from "../../../core/UseCase";
import { PeConnectGateway, PeConnectUserInfo } from "../port/PeConnectGateway";
import { z } from "zod";
import { frontRoutes } from "../../../../shared/routes";

export class LinkUserPeConnectAccount extends UseCase<string, string> {
  inputSchema = z.string();

  constructor(public readonly peConnectGateway: PeConnectGateway) {
    super();
  }

  protected async _execute(authorizationCode: string): Promise<string> {
    const userInfo: PeConnectUserInfo = await this.peConnectGateway.getUserInfo(
      await this.peConnectGateway.oAuthGetAccessTokenThroughAuthorizationCode(
        authorizationCode,
      ),
    );

    return `../${frontRoutes.immersionApplicationsRoute}?email=${encodeURI(
      userInfo.email,
    )}&firstName=${encodeURI(userInfo.family_name)}&lastName=${encodeURI(
      userInfo.given_name,
    )}&peExternalId=${encodeURI(userInfo.idIdentiteExterne)}`;
  }
}
