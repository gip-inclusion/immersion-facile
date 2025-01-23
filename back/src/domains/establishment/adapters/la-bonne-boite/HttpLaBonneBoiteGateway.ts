import Bottleneck from "bottleneck";
import { RomeDto, SearchResultDto, SiretDto, castError } from "shared";
import { HttpClient } from "shared-routes";
import { createLogger } from "../../../../utils/logger";
import { FranceTravailGateway } from "../../../convention/ports/FranceTravailGateway";
import {
  LaBonneBoiteGateway,
  SearchCompaniesParams,
} from "../../ports/LaBonneBoiteGateway";
import { LaBonneBoiteRoutes } from "./LaBonneBoite.routes";
import {
  LaBonneBoiteApiResultV2Props,
  LaBonneBoiteCompanyDto,
} from "./LaBonneBoiteCompanyDto";

const MAX_PAGE_SIZE = 100;
const MAX_DISTANCE_IN_KM = 100;

const lbbMaxQueryPerSeconds = 1;

const lbbV2App = "api_labonneboitev2";

const logger = createLogger(__filename);

export class HttpLaBonneBoiteGateway implements LaBonneBoiteGateway {
  #limiter = new Bottleneck({
    reservoir: lbbMaxQueryPerSeconds,
    reservoirRefreshInterval: 1000, // number of ms
    reservoirRefreshAmount: lbbMaxQueryPerSeconds,
  });

  constructor(
    private readonly httpClient: HttpClient<LaBonneBoiteRoutes>,
    private readonly franceTravailGateway: FranceTravailGateway,
    private readonly franceTravailClientId: string,
  ) {}

  public async searchCompanies({
    distanceKm,
    lat,
    lon,
    romeCode,
    romeLabel,
    nafCodes,
  }: SearchCompaniesParams): Promise<SearchResultDto[]> {
    return this.#limiter
      .schedule(async () =>
        this.httpClient.getCompanies({
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
        }),
      )
      .then((response) => {
        if (response.status !== 200) throw new Error(JSON.stringify(response));
        const items = response.body?.items
          ?.map(
            (props: LaBonneBoiteApiResultV2Props) =>
              new LaBonneBoiteCompanyDto(props),
          )
          .filter((result) => result.isCompanyRelevant())
          .map((result) =>
            result.toSearchResult({ romeCode, romeLabel }, { lat, lon }),
          )
          .filter((result) =>
            result.distance_m ? result.distance_m <= distanceKm * 1000 : true,
          );

        return items ?? [];
      })
      .catch((error) => {
        logger.error({
          error: castError(error),
          message: "searchCompanies_error",
          searchLBB: {
            distanceKm,
            lat,
            lon,
            romeCode,
            romeLabel,
            nafCodes,
          },
        });
        return [];
      });
  }

  public async fetchCompanyBySiret(
    siret: SiretDto,
    romeDto: RomeDto,
  ): Promise<SearchResultDto | null> {
    return this.#limiter
      .schedule(async () =>
        this.httpClient.getCompany({
          headers: {
            authorization: await this.#makeAutorization(),
          },
          queryParams: {
            siret,
          },
        }),
      )
      .then((response) => {
        if (response.status !== 200) throw new Error(JSON.stringify(response));

        const item = response.body?.items
          ?.map(
            (props: LaBonneBoiteApiResultV2Props) =>
              new LaBonneBoiteCompanyDto(props),
          )
          .filter((result) => result.isCompanyRelevant())
          .map((result) => result.toSearchResult(romeDto))
          .at(0);

        return item ?? null;
      })
      .catch((error) => {
        logger.error({
          error: castError(error),
          message: "fetchCompanyBySiret_error",
          siret,
          romeLabel: romeDto.romeLabel,
        });
        throw error;
      });
  }

  async #makeAutorization(): Promise<string> {
    const result = await this.franceTravailGateway.getAccessToken(
      `application_${this.franceTravailClientId} ${lbbV2App}`,
    );

    return `Bearer ${result.access_token}`;
  }
}
