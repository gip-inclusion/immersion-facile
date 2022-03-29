import { UseCase } from "../../../core/UseCase";
import { PeConnectGateway, PeConnectUserInfo } from "../port/PeConnectGateway";
import { z } from "zod";
import { frontRoutes } from "../../../../shared/routes";
import { queryParamsAsString } from "../../../../shared/utils/queryParams";

export class LinkUserPeConnectAccount extends UseCase<string, string> {
  inputSchema = z.string();

  constructor(public readonly peConnectGateway: PeConnectGateway) {
    super();
  }

  protected async _execute(authorizationCode: string): Promise<string> {
    const { sub, gender, ...filteredUserInfo }: Partial<PeConnectUserInfo> =
      await this.peConnectGateway.getUserInfo(
        await this.peConnectGateway.oAuthGetAccessTokenThroughAuthorizationCode(
          authorizationCode,
        ),
      );

    return `${frontRoutes.immersionApplicationsRoute}?${queryParamsAsString<
      Partial<PeConnectUserInfo>
    >(filteredUserInfo)}`;
  }
}
