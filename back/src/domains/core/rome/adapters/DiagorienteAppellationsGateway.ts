import Bottleneck from "bottleneck";
import { AppellationDto, appellationCodeSchema } from "shared";
import { HttpClient } from "shared-routes";
import { createLogger } from "../../../../utils/logger";
import { InMemoryCachingGateway } from "../../caching-gateway/adapters/InMemoryCachingGateway";
import { AppellationsGateway } from "../ports/AppellationsGateway";
import {
  DiagorienteAccessTokenResponse,
  DiagorienteAppellationsRoutes,
  DiagorienteRawResponse,
  diagorienteTokenScope,
} from "./DiagorienteAppellationsGateway.routes";

const ONE_SECOND_MS = 1_000;
const maxResults = 5;
const diagorienteMaxCallRatePerSeconds = 25;

export const requestMinTime = Math.floor(
  ONE_SECOND_MS / diagorienteMaxCallRatePerSeconds,
);

const logger = createLogger(__filename);

export class DiagorienteAppellationsGateway implements AppellationsGateway {
  #limiter = new Bottleneck({
    reservoir: diagorienteMaxCallRatePerSeconds,
    reservoirRefreshInterval: ONE_SECOND_MS, // number of ms
    reservoirRefreshAmount: diagorienteMaxCallRatePerSeconds,
    maxConcurrent: 5,
    minTime: requestMinTime,
  });

  constructor(
    private readonly httpClient: HttpClient<DiagorienteAppellationsRoutes>,
    private caching: InMemoryCachingGateway<DiagorienteAccessTokenResponse>,
    private readonly diagorienteCredentials: {
      clientId: string;
      clientSecret: string;
    },
  ) {}

  async searchAppellations(query: string): Promise<AppellationDto[]> {
    logger.info({ message: "searchAppellations - start" });
    const tokenData = await this.getAccessToken();
    return this.#limiter.schedule(() => {
      logger.info({ message: "searchAppellations - call" });
      return this.httpClient
        .searchAppellations({
          queryParams: { query, nb_results: maxResults * 10, tags: ["ROME4"] },
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        })
        .then(({ body }) => {
          logger.info({ message: "searchAppellations - success" });
          return diagorienteRawResponseToAppellationDto(body);
        })
        .catch((error) => {
          logger.error({ message: "searchAppellations - error", error });
          throw error;
        });
    });
  }

  public getAccessToken(): Promise<DiagorienteAccessTokenResponse> {
    return this.caching.caching(diagorienteTokenScope, () => {
      logger.info({ message: "getAccessToken - start" });
      return this.#limiter.schedule(() =>
        this.httpClient
          .getAccessToken({
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: {
              client_id: this.diagorienteCredentials.clientId,
              client_secret: this.diagorienteCredentials.clientSecret,
              grant_type: "client_credentials",
            },
          })
          .then(({ body }) => {
            logger.info({ message: "getAccessToken - success" });
            return body;
          })
          .catch((error) => {
            logger.error({ error, message: "getAccessToken - error" });
            throw error;
          }),
      );
    });
  }
}

const diagorienteRawResponseToAppellationDto = (
  response: DiagorienteRawResponse,
): AppellationDto[] =>
  response.search_results
    .filter(
      ({ data }) => appellationCodeSchema.safeParse(data.code_ogr).success,
    )
    .sort((a, b) => (a.similarity <= b.similarity ? 1 : -1))
    .filter((_, index) => index <= maxResults - 1)
    .map(({ data }) => ({
      appellationLabel: data.titre,
      appellationCode: data.code_ogr,
    }));
