import {
  AccessTokenGateway,
  GetAccessTokenResponse,
} from "../../domain/core/ports/AccessTokenGateway";
import { logger as rootLogger } from "../../utils/logger";

export class InMemoryAccessTokenGateway implements AccessTokenGateway {
  private readonly logger = rootLogger.child({
    logsource: "InMemoryAccessTokenGateway",
  });

  public async getAccessToken(scope: string): Promise<GetAccessTokenResponse> {
    this.logger.info({ scope }, "getAccessToken");
    return {
      access_token: `fake_access_token_for_scope_${scope}`,
      expires_in: 600,
    };
  }
}
