import { AccessTokenResponse } from "../../../../config/bootstrap/appConfig";
import {
  FranceTravailBroadcastResponse,
  FranceTravailConvention,
  FranceTravailGateway,
} from "../../ports/FranceTravailGateway";

export class InMemoryFranceTravailGateway implements FranceTravailGateway {
  #nextResponse: FranceTravailBroadcastResponse = {
    status: 200,
    body: { success: true },
  };

  constructor(public notifications: FranceTravailConvention[] = []) {}

  public async getAccessToken(scope: string): Promise<AccessTokenResponse> {
    return {
      access_token: `fake_access_token_for_scope_${scope}`,
      expires_in: 600,
    };
  }

  public async notifyOnConventionUpdated(
    convention: FranceTravailConvention,
  ): Promise<FranceTravailBroadcastResponse> {
    if (convention.statut === "DEMANDE_OBSOLETE") {
      throw new Error("fake axios error");
    }
    this.notifications.push(convention);
    return this.#nextResponse;
  }

  //For testing purpose

  public setNextResponse(response: FranceTravailBroadcastResponse) {
    this.#nextResponse = response;
  }
}
