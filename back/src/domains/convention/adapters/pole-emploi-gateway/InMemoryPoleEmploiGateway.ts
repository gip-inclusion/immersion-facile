import { AccessTokenResponse } from "../../../../config/bootstrap/appConfig";
import {
  PoleEmploiBroadcastResponse,
  PoleEmploiConvention,
  PoleEmploiGateway,
} from "../../ports/PoleEmploiGateway";

export class InMemoryPoleEmploiGateway implements PoleEmploiGateway {
  #nextResponse: PoleEmploiBroadcastResponse = {
    status: 200,
    body: { succes: true },
  };

  constructor(public notifications: PoleEmploiConvention[] = []) {}

  public async getAccessToken(scope: string): Promise<AccessTokenResponse> {
    return {
      access_token: `fake_access_token_for_scope_${scope}`,
      expires_in: 600,
    };
  }

  public async notifyOnConventionUpdated(
    convention: PoleEmploiConvention,
  ): Promise<PoleEmploiBroadcastResponse> {
    if (convention.statut === "DEMANDE_OBSOLETE") {
      throw new Error("fake axios error");
    }
    this.notifications.push(convention);
    return this.#nextResponse;
  }

  //For testing purpose

  public setNextResponse(response: PoleEmploiBroadcastResponse) {
    this.#nextResponse = response;
  }
}
