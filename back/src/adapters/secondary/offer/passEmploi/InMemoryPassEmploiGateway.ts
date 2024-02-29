import {
  PassEmploiGateway,
  PassEmploiNotificationParams,
} from "../../../../domains/establishment/ports/PassEmploiGateway";

export class InMemoryPassEmploiGateway implements PassEmploiGateway {
  constructor(public notifications: PassEmploiNotificationParams[] = []) {}

  public async notifyOnNewImmersionOfferCreatedFromForm(
    notificationParams: PassEmploiNotificationParams,
  ): Promise<void> {
    this.notifications.push(notificationParams);
  }
}
