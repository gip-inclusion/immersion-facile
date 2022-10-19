import {
  PassEmploiGateway,
  PassEmploiNotificationParams,
} from "../../../../domain/immersionOffer/ports/PassEmploiGateway";
import { createAxiosInstance } from "../../../../utils/axiosUtils";
import { createLogger } from "../../../../utils/logger";
import { notifyAndThrowErrorDiscord } from "../../../../utils/notifyDiscord";

const logger = createLogger(__filename);

export class HttpPassEmploiGateway implements PassEmploiGateway {
  constructor(private url: string, private key: string) {}

  public async notifyOnNewImmersionOfferCreatedFromForm(
    notificationParams: PassEmploiNotificationParams,
  ): Promise<void> {
    const axios = createAxiosInstance(logger);
    const response = await axios.post(this.url, notificationParams, {
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "X-API-KEY": this.key,
      },
    });

    if (response.status !== 202) {
      notifyAndThrowErrorDiscord(
        new Error(
          `Could not notify Pass-Emploi : ${response.status} ${response.statusText}`,
        ),
      );
    }
  }
}
