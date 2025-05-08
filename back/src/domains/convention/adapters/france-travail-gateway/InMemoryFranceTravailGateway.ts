import { errors } from "shared";
import type { AccessTokenResponse } from "../../../../config/bootstrap/appConfig";
import type {
  FranceTravailBroadcastResponse,
  FranceTravailConvention,
  FranceTravailGateway,
} from "../../ports/FranceTravailGateway";
import type { BroadcastConventionParams } from "../../use-cases/broadcast/broadcastConventionParams";

export class InMemoryFranceTravailGateway implements FranceTravailGateway {
  #nextLegacyResponse: FranceTravailBroadcastResponse = {
    status: 200,
    body: { success: true },
  };

  #nextResponse: FranceTravailBroadcastResponse = {
    status: 200,
    body: { success: true },
  };

  constructor(
    public legacyBroadcastConventionCalls: FranceTravailConvention[] = [],
    public broadcastParamsCalls: BroadcastConventionParams[] = [],
  ) {}

  public async getAccessToken(scope: string): Promise<AccessTokenResponse> {
    return {
      access_token: `fake_access_token_for_scope_${scope}`,
      expires_in: 600,
      scope,
      token_type: "Bearer",
    };
  }

  public async notifyOnConventionUpdatedLegacy(
    convention: FranceTravailConvention,
  ): Promise<FranceTravailBroadcastResponse> {
    if (convention.statut === "DEMANDE_OBSOLETE") {
      throw errors.generic.fakeError("fake axios error");
    }
    this.legacyBroadcastConventionCalls.push(convention);
    return this.#nextLegacyResponse;
  }

  public async notifyOnConventionUpdated(
    params: BroadcastConventionParams,
  ): Promise<FranceTravailBroadcastResponse> {
    this.broadcastParamsCalls.push(params);
    return this.#nextResponse;
  }

  //For testing purpose

  public setNextLegacyResponse(response: FranceTravailBroadcastResponse) {
    this.#nextLegacyResponse = response;
  }

  public setNextResponse(response: FranceTravailBroadcastResponse) {
    this.#nextResponse = response;
  }
}
