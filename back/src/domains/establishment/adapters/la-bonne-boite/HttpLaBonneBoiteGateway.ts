import Bottleneck from "bottleneck";
import { SearchResultDto, castError } from "shared";
import { HttpClient } from "shared-routes";
import { createLogger } from "../../../../utils/logger";
import { PoleEmploiGateway } from "../../../convention/ports/PoleEmploiGateway";
import {
  LaBonneBoiteGateway,
  LaBonneBoiteRequestParams,
} from "../../ports/LaBonneBoiteGateway";
import { LaBonneBoiteRoutes } from "./LaBonneBoite.routes";
import {
  LaBonneBoiteApiResultProps,
  LaBonneBoiteCompanyDto,
} from "./LaBonneBoiteCompanyDto";

const MAX_PAGE_SIZE = 100;
const MAX_DISTANCE_IN_KM = 100;

const lbbMaxQueryPerSeconds = 1;

const logger = createLogger(__filename);
export class HttpLaBonneBoiteGateway implements LaBonneBoiteGateway {
  #limiter = new Bottleneck({
    reservoir: lbbMaxQueryPerSeconds,
    reservoirRefreshInterval: 1000, // number of ms
    reservoirRefreshAmount: lbbMaxQueryPerSeconds,
  });

  constructor(
    private readonly httpClient: HttpClient<LaBonneBoiteRoutes>,
    private readonly poleEmploiGateway: PoleEmploiGateway,
    private readonly poleEmploiClientId: string,
  ) {}

  public async searchCompanies({
    distanceKm,
    lat,
    lon,
    rome,
  }: LaBonneBoiteRequestParams): Promise<SearchResultDto[]> {
    logger.warn({
      message: "searchCompanies",
      search: {
        distanceKm,
        lat,
        lon,
        rome,
      },
    });
    return this.#limiter
      .schedule(async () =>
        this.poleEmploiGateway
          .getAccessToken(
            `application_${this.poleEmploiClientId} api_labonneboitev1`,
          )
          .then((accessToken) =>
            this.httpClient.getCompany({
              headers: {
                authorization: createAuthorization(accessToken.access_token),
              },
              queryParams: {
                distance: MAX_DISTANCE_IN_KM,
                longitude: lon,
                latitude: lat,
                page: 1,
                page_size: MAX_PAGE_SIZE,
                rome_codes: rome,
                sort: "distance",
              },
            }),
          ),
      )
      .then(({ body }) =>
        body.companies
          .map(
            (props: LaBonneBoiteApiResultProps) =>
              new LaBonneBoiteCompanyDto(props),
          )
          .filter(
            (result) =>
              result.props.distance <= distanceKm && result.isCompanyRelevant(),
          )
          .map((result) => result.toSearchResult()),
      )
      .catch((error) => {
        logger.error({
          error: castError(error),
          message: "searchCompanies_error",
          search: {
            distanceKm,
            lat,
            lon,
            rome,
          },
        });
        throw error;
      });
  }
}

const createAuthorization = (accessToken: string) => `Bearer ${accessToken}`;
