import {
  PoleEmploiBroadcastResponse,
  PoleEmploiConvention,
  PoleEmploiGateway,
} from "../../../../domain/convention/ports/PoleEmploiGateway";
import { createLogger } from "../../../../utils/logger";

const logger = createLogger(__filename);
export class InMemoryPoleEmploiGateway implements PoleEmploiGateway {
  constructor(public notifications: PoleEmploiConvention[] = []) {}

  private nextResponse: PoleEmploiBroadcastResponse = { status: 200 };

  public async notifyOnConventionUpdated(
    convention: PoleEmploiConvention,
  ): Promise<PoleEmploiBroadcastResponse> {
    logger.info(
      { conventionId: convention.id },
      "In Memory - Fake Sending convention to PE",
    );
    this.notifications.push(convention);
    return this.nextResponse;
  }

  setNextResponse(response: PoleEmploiBroadcastResponse) {
    this.nextResponse = response;
  }
}
