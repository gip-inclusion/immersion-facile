import Bottleneck from "bottleneck";
import { SearchResultDto } from "shared";
import { HttpClient } from "http-client";
import { PoleEmploiGateway } from "../../../../domain/convention/ports/PoleEmploiGateway";
import {
  LaBonneBoiteGateway,
  LaBonneBoiteRequestParams,
} from "../../../../domain/offer/ports/LaBonneBoiteGateway";
import {
  LaBonneBoiteApiResultProps,
  LaBonneBoiteCompanyDto,
} from "./LaBonneBoiteCompanyDto";
import { LaBonneBoiteTargets } from "./LaBonneBoiteTargets";

const MAX_PAGE_SIZE = 100;
const MAX_DISTANCE_IN_KM = 100;

const lbbMaxQueryPerSeconds = 1;

export class HttpLaBonneBoiteGateway implements LaBonneBoiteGateway {
  #limiter = new Bottleneck({
    reservoir: lbbMaxQueryPerSeconds,
    reservoirRefreshInterval: 1000, // number of ms
    reservoirRefreshAmount: lbbMaxQueryPerSeconds,
  });

  constructor(
    private readonly httpClient: HttpClient<LaBonneBoiteTargets>,
    private readonly poleEmploiGateway: PoleEmploiGateway,
    private readonly poleEmploiClientId: string,
  ) {}

  public async searchCompanies({
    distanceKm,
    lat,
    lon,
    rome,
  }: LaBonneBoiteRequestParams): Promise<SearchResultDto[]> {
    const { responseBody } = await this.#limiter.schedule(async () => {
      const accessToken = await this.poleEmploiGateway.getAccessToken(
        `application_${this.poleEmploiClientId} api_labonneboitev1`,
      );

      return this.httpClient.getCompany({
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
      });
    });

    return responseBody.companies
      .map(
        (props: LaBonneBoiteApiResultProps) =>
          new LaBonneBoiteCompanyDto(props),
      )
      .filter(
        (result) =>
          result.props.distance <= distanceKm && result.isCompanyRelevant(),
      )
      .map((result) => result.toSearchResult());
  }
}

const createAuthorization = (accessToken: string) => `Bearer ${accessToken}`;
