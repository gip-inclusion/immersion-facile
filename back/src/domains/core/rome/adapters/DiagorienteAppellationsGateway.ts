import Bottleneck from "bottleneck";
import { AppellationAndRomeDto, AppellationCode } from "shared";
import { HttpClient } from "shared-routes";
import { InMemoryCachingGateway } from "../../caching-gateway/adapters/InMemoryCachingGateway";
import { AppellationsGateway } from "../ports/AppellationsGateway";
import { DiagorienteAppellationsRoutes } from "./DiagorienteAppellationsGateway.routes";

const diagorienteMaxCallRatePerSeconds = 10;

const maxResults = 5;

export const diagorienteTokenScope: keyof DiagorienteAccessTokenResponse =
  "expires_in";

export type DiagorienteRawResponse = {
  search_id: string;
  original_query: string[];
  rewritten_query: string[];
  search_results: DiagorienteSearchResult[];
};

export type DiagorienteSearchResult = {
  position: number;
  item: DiagorienteItem;
  score_matching: number;
};

export type DiagorienteItem = {
  type: string;
  key: string;
  _key: string;
  titre: string;
  rome: string;
  code_ogr: AppellationCode;
  naf: string[];
  niveau: string;
};

export type DiagorienteAccessTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  "not-before-policy": number;
  scope: string;
};

export class DiagorienteAppellationsGateway implements AppellationsGateway {
  #limiter = new Bottleneck({
    reservoir: diagorienteMaxCallRatePerSeconds,
    reservoirRefreshInterval: 1000, // number of ms
    reservoirRefreshAmount: diagorienteMaxCallRatePerSeconds,
  });

  constructor(
    private readonly httpClient: HttpClient<DiagorienteAppellationsRoutes>,
    private caching: InMemoryCachingGateway<DiagorienteAccessTokenResponse>,
    private readonly diagorienteCredentials: {
      clientId: string;
      clientSecret: string;
    },
  ) {}

  async searchAppellations(query: string): Promise<AppellationAndRomeDto[]> {
    const tokenData = await this.getAccessToken();
    return this.#limiter.schedule(() =>
      this.httpClient
        .searchAppellations({
          queryParams: { query, nb_results: maxResults },
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        })
        .then((response) =>
          diagorienteRawResponseToAppellationAndRomeDto(response.body),
        ),
    );
  }

  getAccessToken(): Promise<DiagorienteAccessTokenResponse> {
    return this.caching.caching(diagorienteTokenScope, () =>
      this.#limiter.schedule(() =>
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
          .then((response) => response.body),
      ),
    );
  }
}

const diagorienteRawResponseToAppellationAndRomeDto = (
  response: DiagorienteRawResponse,
): AppellationAndRomeDto[] =>
  response.search_results.map((result) => ({
    appellationLabel: result.item.titre,
    appellationCode: result.item.code_ogr,
    romeCode: result.item.rome,
    romeLabel: result.item.rome, // TODO: fetch rome label
  }));
