import {
  GetAccessTokenResponse,
  PoleEmploiBroadcastResponse,
  PoleEmploiConvention,
  PoleEmploiGateway,
} from "../../../domain/convention/ports/PoleEmploiGateway";

export class InMemoryPoleEmploiGateway implements PoleEmploiGateway {
  constructor(public notifications: PoleEmploiConvention[] = []) {}

  private nextResponse: PoleEmploiBroadcastResponse = { status: 200 };

  public async notifyOnConventionUpdated(
    convention: PoleEmploiConvention,
  ): Promise<PoleEmploiBroadcastResponse> {
    this.notifications.push(convention);
    return this.nextResponse;
  }

  public async getAccessToken(scope: string): Promise<GetAccessTokenResponse> {
    return {
      access_token: `fake_access_token_for_scope_${scope}`,
      expires_in: 600,
    };
  }

  //For testing purpose

  public setNextResponse(response: PoleEmploiBroadcastResponse) {
    this.nextResponse = response;
  }
}
