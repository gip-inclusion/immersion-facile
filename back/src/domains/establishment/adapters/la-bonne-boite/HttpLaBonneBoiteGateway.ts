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
  LaBonneBoiteApiResultV1Props,
  LaBonneBoiteApiResultV2Props,
  LaBonneBoiteCompanyDto,
} from "./LaBonneBoiteCompanyDto";

const MAX_PAGE_SIZE = 100;
const MAX_DISTANCE_IN_KM = 100;

const lbbMaxQueryPerSeconds = 1;

const _lbbV1App = "api_labonneboitev1";
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
      searchLBB: {
        distanceKm,
        lat,
        lon,
        rome,
      },
    });
    return this.#limiter
      .schedule(async () => {
        const { access_token } = await this.poleEmploiGateway.getAccessToken(
          `application_${this.poleEmploiClientId} ${lbbV2App}`,
        );
        console.log("access_token", access_token);
        return this.httpClient.getCompany({
          headers: {
            authorization: createAuthorization(access_token),
          },
          queryParams: {
            job: "comptable",
            latitude: 48.86,
            longitude: 2.34,
            distance: 100,
          },
        });
      })
      .then(({ body }) => {
        console.log("body ===>", JSON.stringify(body.items, null, 2));
        return body.items
          .map(
            (props: LaBonneBoiteApiResultV2Props) =>
              new LaBonneBoiteCompanyDto(props),
          )
          .filter(
            (result) =>
              result.props.distance <= distanceKm && result.isCompanyRelevant(),
          )
          .map((result) => result.toSearchResult());
      })
      .catch((error) => {
        console.log("error ===>", error);
        logger.error({
          error: castError(error),
          message: "searchCompanies_error",
          searchLBB: {
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
