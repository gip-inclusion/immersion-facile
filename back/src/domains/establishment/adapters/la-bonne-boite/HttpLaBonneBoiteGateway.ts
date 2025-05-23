import Bottleneck from "bottleneck";
import type { RomeDto, SearchResultDto, SiretDto } from "shared";
import type { HttpClient } from "shared-routes";
import type { FranceTravailGateway } from "../../../convention/ports/FranceTravailGateway";
import type { WithCache } from "../../../core/caching-gateway/port/WithCache";
import type {
  LaBonneBoiteGateway,
  SearchCompaniesParams,
} from "../../ports/LaBonneBoiteGateway";
import type { LaBonneBoiteRoutes } from "./LaBonneBoite.routes";
import {
  type LaBonneBoiteApiResultV2Props,
  LaBonneBoiteCompanyDto,
} from "./LaBonneBoiteCompanyDto";

const MAX_PAGE_SIZE = 100;
const MAX_DISTANCE_IN_KM = 100;

const lbbMaxQueryPerSeconds = 1;

const lbbV2App = "api_labonneboitev2";

export class HttpLaBonneBoiteGateway implements LaBonneBoiteGateway {
  #limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: (1 / lbbMaxQueryPerSeconds) * 1000 * 2, // 2x is the number of instances of node running this.
  });

  constructor(
    private readonly httpClient: HttpClient<LaBonneBoiteRoutes>,
    private readonly franceTravailGateway: FranceTravailGateway,
    private readonly franceTravailClientId: string,
    private readonly withCache: WithCache,
    private readonly lbbRoute: LaBonneBoiteRoutes,
  ) {}

  public async searchCompanies(
    searchCompaniesParams: SearchCompaniesParams,
  ): Promise<SearchResultDto[]> {
    const cachedGetLbbResults = this.withCache<
      SearchResultDto[],
      SearchCompaniesParams
    >({
      logParams: {
        partner: "laBonneBoite",
        route: this.lbbRoute.getCompanies,
      },
      getCacheKey: (query) =>
        `lbb_${query.romeCode}_${query.lat.toFixed(3)}_${query.lon.toFixed(3)}${
          query.nafCodes ? `_${query.nafCodes.join("_")}` : ""
        }`,
      cb: async ({
        lon,
        lat,
        romeCode,
        nafCodes,
      }): Promise<SearchResultDto[]> => {
        return this.httpClient
          .getCompanies({
            headers: {
              authorization: await this.#makeAutorization(),
            },
            queryParams: {
              distance: MAX_DISTANCE_IN_KM,
              longitude: lon,
              latitude: lat,
              page: 1,
              page_size: MAX_PAGE_SIZE,
              rome: [romeCode],
              ...(nafCodes ? { naf: nafCodes } : {}),
            },
          })
          .then((response) => {
            if (response.status !== 200)
              throw new Error(JSON.stringify(response));
            return response.body?.items ?? [];
          })
          .then((results) =>
            results
              .map(
                (props: LaBonneBoiteApiResultV2Props) =>
                  new LaBonneBoiteCompanyDto(props),
              )
              .filter((result) => result.isCompanyRelevant())
              .map((result) =>
                result.toSearchResult(
                  {
                    romeCode: searchCompaniesParams.romeCode,
                    romeLabel: searchCompaniesParams.romeLabel,
                  },
                  {
                    lat: searchCompaniesParams.lat,
                    lon: searchCompaniesParams.lon,
                  },
                ),
              ),
          );
      },
    });

    return this.#limiter.schedule(() =>
      cachedGetLbbResults(searchCompaniesParams)
        .then((results) =>
          results.filter((result) =>
            result.distance_m
              ? result.distance_m <= searchCompaniesParams.distanceKm * 1000
              : true,
          ),
        )
        .catch(() => {
          return [];
        }),
    );
  }

  public async fetchCompanyBySiret(
    siret: SiretDto,
    romeDto: RomeDto,
  ): Promise<SearchResultDto | null> {
    const cachedGetLbbResult = this.withCache({
      logParams: {
        partner: "laBonneBoite",
        route: this.lbbRoute.getCompany,
      },
      getCacheKey: (siret) => `lbb_${siret}`,
      cb: async (siret): Promise<SearchResultDto | null> => {
        return this.httpClient
          .getCompany({
            headers: {
              authorization: await this.#makeAutorization(),
            },
            queryParams: {
              siret,
            },
          })
          .then((response) => {
            if (response.status !== 200)
              throw new Error(JSON.stringify(response));
            const results = response.body?.items ?? [];

            return (
              results
                .map(
                  (props: LaBonneBoiteApiResultV2Props) =>
                    new LaBonneBoiteCompanyDto(props),
                )
                .filter((result) => result.isCompanyRelevant())
                .map((result) => result.toSearchResult(romeDto))
                .at(0) ?? null
            );
          });
      },
    });

    return this.#limiter.schedule(async () => cachedGetLbbResult(siret));
  }

  async #makeAutorization(): Promise<string> {
    const result = await this.franceTravailGateway.getAccessToken(
      `application_${this.franceTravailClientId} ${lbbV2App}`,
    );

    return `Bearer ${result.access_token}`;
  }
}
