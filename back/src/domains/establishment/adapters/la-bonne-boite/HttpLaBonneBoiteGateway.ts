import Bottleneck from "bottleneck";
import { RomeDto, SearchResultDto, SiretDto, castError } from "shared";
import { HttpClient } from "shared-routes";
import { createLogger } from "../../../../utils/logger";
import { FranceTravailGateway } from "../../../convention/ports/FranceTravailGateway";
import {
  LaBonneBoiteGateway,
  LaBonneBoiteRequestParams,
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
    rome,
    romeLabel,
  }: LaBonneBoiteRequestParams): Promise<SearchResultDto[]> {
    return this.#limiter
      .schedule(async () => {
        const { access_token } = await this.franceTravailGateway.getAccessToken(
          `application_${this.franceTravailClientId} ${lbbV2App}`,
        );
        return this.httpClient.getCompanies({
          headers: {
            authorization: createAuthorization(access_token),
          },
          queryParams: {
            distance: MAX_DISTANCE_IN_KM,
            longitude: lon,
            latitude: lat,
            page: 1,
            page_size: MAX_PAGE_SIZE,
            rome: [rome],
          },
        });
      })
      .then(({ body }) => {
        const items = body?.items;
        return items
          ? items
              .map(
                (props: LaBonneBoiteApiResultV2Props) =>
                  new LaBonneBoiteCompanyDto(props),
              )
              .filter((result) => result.isCompanyRelevant())
              .map((result) =>
                result.toSearchResult(
                  { romeCode: rome, romeLabel },
                  { lat, lon },
                ),
              )
          : [];
      })
      .catch((error) => {
        logger.error({
          error: castError(error),
          message: "searchCompanies_error",
          searchLBB: {
            distanceKm,
            lat,
            lon,
            rome,
            romeLabel,
          },
        });
        throw error;
      });
  }

  public async fetchCompanyBySiret(
    siret: SiretDto,
    romeDto: RomeDto,
  ): Promise<SearchResultDto | null> {
    return this.#limiter
      .schedule(async () => {
        const { access_token } = await this.franceTravailGateway.getAccessToken(
          `application_${this.franceTravailClientId} ${lbbV2App}`,
        );
        return this.httpClient.getCompany({
          headers: {
            authorization: createAuthorization(access_token),
          },
          queryParams: {
            siret,
          },
        });
      })
      .then(({ body }) => {
        const items = body?.items;
        const item = items
          ? items
              .map(
                (props: LaBonneBoiteApiResultV2Props) =>
                  new LaBonneBoiteCompanyDto(props),
              )
              .filter((result) => result.isCompanyRelevant())
              .map((result) => result.toSearchResult(romeDto))
              .at(0)
          : null;
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
}

const createAuthorization = (accessToken: string) => `Bearer ${accessToken}`;
