import * as Sentry from "@sentry/node";
import Bottleneck from "bottleneck";
import { secondsToMilliseconds } from "date-fns";
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

const lbbMaxQueryPerSeconds = 1;
const numberOfIFInstances = 2; // 2x is the number of instances of node running this.

const lbbScope = "api_labonneboitev2 search office"; // office is probably useless for IF, but better to be safe than sorry

export class HttpLaBonneBoiteGateway implements LaBonneBoiteGateway {
  #limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: secondsToMilliseconds(
      (1 / lbbMaxQueryPerSeconds) * numberOfIFInstances,
    ),
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
    return Sentry.startSpan(
      { name: "LaBonneBoiteGateway.searchCompanies" },
      async () =>
        this.withCache<SearchResultDto[], SearchCompaniesParams>({
          logParams: {
            partner: "laBonneBoite",
            route: this.lbbRoute.getCompanies,
          },
          getCacheKey: ({ lat, lon, romeCode, nafCodes }) =>
            `lbb_${romeCode}_${lat.toFixed(3)}_${lon.toFixed(3)}${
              nafCodes ? `_${nafCodes.join("_")}` : ""
            }`,
          cb: async ({
            lon,
            lat,
            romeCode,
            nafCodes,
            distanceKm,
            page,
            perPage,
          }) =>
            this.#limiter.schedule(async () =>
              this.httpClient
                .getCompanies({
                  headers: {
                    authorization: await this.#makeAutorization(),
                  },
                  queryParams: {
                    distance: distanceKm,
                    longitude: lon,
                    latitude: lat,
                    page,
                    page_size: perPage,
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
                ),
            ),
        })(searchCompaniesParams)
          .then((results) =>
            results.filter((result) =>
              result.distance_m
                ? result.distance_m <= searchCompaniesParams.distanceKm * 1000
                : true,
            ),
          )
          .catch(() => []),
    );
  }

  public async fetchCompanyBySiret(
    siret: SiretDto,
    romeDto: RomeDto,
  ): Promise<SearchResultDto | null> {
    return this.withCache({
      logParams: {
        partner: "laBonneBoite",
        route: this.lbbRoute.getCompany,
      },
      getCacheKey: (siret) => `lbb_${siret}`,
      cb: async (siret) =>
        this.#limiter.schedule(async () =>
          this.httpClient
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
            }),
        ),
    })(siret);
  }

  async #makeAutorization(): Promise<string> {
    const result = await this.franceTravailGateway.getAccessToken(
      `application_${this.franceTravailClientId} ${lbbScope}`,
    );

    return `Bearer ${result.access_token}`;
  }
}
