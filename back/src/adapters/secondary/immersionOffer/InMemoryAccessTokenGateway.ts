import {
  AccessTokenGateway,
  GetAccessTokenResponse,
} from "../../../domain/core/ports/AccessTokenGateway";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class InMemoryAccessTokenGateway implements AccessTokenGateway {
  public async getAccessToken(scope: string): Promise<GetAccessTokenResponse> {
    logger.info({ scope }, "getAccessToken");
    return {
      access_token: `fake_access_token_for_scope_${scope}`,
      expires_in: 600,
    };
  }
}
