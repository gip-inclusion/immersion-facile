import {
  PoleEmploiGateway,
  PoleEmploiConvention,
} from "../../domain/convention/ports/PoleEmploiGateway";

export class InMemoryPoleEmploiGateway implements PoleEmploiGateway {
  constructor(public notifications: PoleEmploiConvention[] = []) {}

  public async notifyOnConventionUpdated(
    convention: PoleEmploiConvention,
  ): Promise<void> {
    this.notifications.push(convention);
  }
}
