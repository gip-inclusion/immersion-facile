import Bottleneck from "bottleneck";
import { HttpClient } from "http-client";
import { AccessTokenGateway } from "../../../../domain/core/ports/AccessTokenGateway";
import {
  LaBonneBoiteAPI,
  LaBonneBoiteRequestParams,
} from "../../../../domain/immersionOffer/ports/LaBonneBoiteAPI";
import {
  LaBonneBoiteCompanyProps,
  LaBonneBoiteCompanyVO,
} from "../../../../domain/immersionOffer/valueObjects/LaBonneBoiteCompanyVO";
import { LaBonneBoiteTargets } from "./LaBonneBoiteTargets";

const MAX_PAGE_SIZE = 100;
const MAX_DISTANCE_IN_KM = 100;

const lbbMaxQueryPerSeconds = 1;

export class HttpLaBonneBoiteAPI implements LaBonneBoiteAPI {
  constructor(
    private readonly httpClient: HttpClient<LaBonneBoiteTargets>,
    private readonly accessTokenGateway: AccessTokenGateway,
    private readonly poleEmploiClientId: string,
  ) {}

  public async searchCompanies(
    searchParams: LaBonneBoiteRequestParams,
  ): Promise<LaBonneBoiteCompanyVO[]> {
    const { responseBody } = await this.limiter.schedule(async () => {
      const accessToken = await this.accessTokenGateway.getAccessToken(
        `application_${this.poleEmploiClientId} api_labonneboitev1`,
      );

      return this.httpClient.getCompany({
        headers: {
          authorization: createAuthorization(accessToken.access_token),
        },
        queryParams: {
          distance: MAX_DISTANCE_IN_KM,
          longitude: searchParams.lon,
          latitude: searchParams.lat,
          page: 1,
          page_size: MAX_PAGE_SIZE,
          rome_codes: searchParams.rome,
          sort: "distance",
        },
      });
    });

    return responseBody.companies.map(
      (props: LaBonneBoiteCompanyProps) => new LaBonneBoiteCompanyVO(props),
    );
  }

  private limiter = new Bottleneck({
    reservoir: lbbMaxQueryPerSeconds,
    reservoirIncreaseInterval: 1000, // number of ms
    reservoirRefreshAmount: lbbMaxQueryPerSeconds,
  });
}

const createAuthorization = (accessToken: string) => `Bearer ${accessToken}`;
