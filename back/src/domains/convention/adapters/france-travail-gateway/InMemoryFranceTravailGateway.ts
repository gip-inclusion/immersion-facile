import type { AccessTokenResponse } from "../../../../config/bootstrap/appConfig";
import type {
  FranceTravailBroadcastResponse,
  FranceTravailGateway,
} from "../../ports/FranceTravailGateway";
import type { BroadcastConventionParams } from "../../use-cases/broadcast/broadcastConventionParams";

export class InMemoryFranceTravailGateway implements FranceTravailGateway {
  #nextResponse: FranceTravailBroadcastResponse = {
    status: 200,
    body: { success: true },
  };

  constructor(public broadcastParamsCalls: BroadcastConventionParams[] = []) {}

  public async getAccessToken(scope: string): Promise<AccessTokenResponse> {
    return {
      access_token: `fake_access_token_for_scope_${scope}`,
      expires_in: 600,
      scope,
      token_type: "Bearer",
    };
  }

  public async notifyOnConventionUpdated(
    params: BroadcastConventionParams,
  ): Promise<FranceTravailBroadcastResponse> {
    this.broadcastParamsCalls.push(params);
    return this.#nextResponse;
  }

  //For testing purpose

  public setNextResponse(response: FranceTravailBroadcastResponse) {
    this.#nextResponse = response;
  }
}
