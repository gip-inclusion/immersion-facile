import {
  PoleEmploiGateway,
  PoleEmploiConvention,
} from "../../../domain/convention/ports/PoleEmploiGateway";
import { createAxiosInstance } from "../../../utils/axiosUtils";
import { createLogger } from "../../../utils/logger";
import { notifyAndThrowErrorDiscord } from "../../../utils/notifyDiscord";

const logger = createLogger(__filename);

export class HttpPoleEmploiGateway implements PoleEmploiGateway {
  constructor(private url: string, private key: string) {}

  public async notifyOnConventionUpdated(
    poleEmploiConvention: PoleEmploiConvention,
  ): Promise<void> {
    const axios = createAxiosInstance(logger);
    const response = await axios.post(this.url, poleEmploiConvention, {
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "X-API-KEY": this.key,
      },
    });

    if (response.status !== 202) {
      notifyAndThrowErrorDiscord(
        new Error(
          `Could not notify Pole-Emploi : ${response.status} ${response.statusText}`,
        ),
      );
    }
  }
}
