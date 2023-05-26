import {
  PoleEmploiBroadcastResponse,
  PoleEmploiConvention,
  PoleEmploiGateway,
} from "../../../../domain/convention/ports/PoleEmploiGateway";

export class InMemoryPoleEmploiGateway implements PoleEmploiGateway {
  constructor(public notifications: PoleEmploiConvention[] = []) {}

  private nextResponse: PoleEmploiBroadcastResponse = { status: 200 };

  public async notifyOnConventionUpdated(
    convention: PoleEmploiConvention,
  ): Promise<PoleEmploiBroadcastResponse> {
    this.notifications.push(convention);
    return this.nextResponse;
  }

  setNextResponse(response: PoleEmploiBroadcastResponse) {
    this.nextResponse = response;
  }
}
