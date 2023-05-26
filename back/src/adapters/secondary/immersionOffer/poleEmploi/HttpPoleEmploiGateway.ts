import axios from "axios";
import Bottleneck from "bottleneck";
import { AbsoluteUrl } from "shared";
import { HttpClient, HttpResponse } from "http-client";
import {
  PoleEmploiBroadcastResponse,
  PoleEmploiConvention,
  PoleEmploiGateway,
} from "../../../../domain/convention/ports/PoleEmploiGateway";
import { AccessTokenGateway } from "../../../../domain/core/ports/AccessTokenGateway";
import { createLogger } from "../../../../utils/logger";
import { notifyAndThrowErrorDiscord } from "../../../../utils/notifyDiscord";
import { getPeTestPrefix, PoleEmploiTargets } from "./PoleEmploi.targets";

const logger = createLogger(__filename);

const peBroadcastMaxRatePerSecond = 3;

export class HttpPoleEmploiGateway implements PoleEmploiGateway {
  private peTestPrefix: "test" | "";

  constructor(
    private readonly httpClient: HttpClient<PoleEmploiTargets>,
    private readonly peApiUrl: AbsoluteUrl,
    private readonly accessTokenGateway: AccessTokenGateway,
  ) {
    this.peTestPrefix = getPeTestPrefix(peApiUrl);
  }

  public async notifyOnConventionUpdated(
    poleEmploiConvention: PoleEmploiConvention,
  ): Promise<PoleEmploiBroadcastResponse> {
    return this.postPoleEmploiConvention(poleEmploiConvention)
      .then((response) => ({ status: response.status as 200 | 201 }))
      .catch((error) => {
        if (!axios.isAxiosError(error) || !error.response) {
          throw error;
        }

        if (error.response.status === 404) {
          return {
            status: 404,
            message: error.response.data?.message,
          };
        }

        const errorObject = {
          _title: "PeBroadcastError",
          status: "errored",
          httpStatus: error.response.status,
          message: error.message,
          axiosBody: error.response.data,
        };
        logger.error(errorObject);
        notifyAndThrowErrorDiscord(
          new Error(
            `Could not notify Pole-Emploi : ${errorObject.httpStatus} - ${errorObject.message} \n ${errorObject?.axiosBody?.message}`,
          ),
        );

        return {
          status: error.response.status,
          message: error.response.data?.message,
        };
      });
  }

  private async postPoleEmploiConvention(
    poleEmploiConvention: PoleEmploiConvention,
  ): Promise<HttpResponse<void>> {
    const accessTokenResponse = await this.accessTokenGateway.getAccessToken(
      `echangespmsmp api_${this.peTestPrefix}immersion-prov2`,
    );

    return this.limiter.schedule(() =>
      this.httpClient.broadcastConvention({
        body: poleEmploiConvention,
        headers: {
          authorization: `Bearer ${accessTokenResponse.access_token}`,
        },
      }),
    );
  }

  private limiter = new Bottleneck({
    reservoir: peBroadcastMaxRatePerSecond,
    reservoirRefreshInterval: 1000, // number of ms
    reservoirRefreshAmount: peBroadcastMaxRatePerSecond,
  });
}
