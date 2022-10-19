import { AxiosResponse } from "axios";
import { secondsToMilliseconds } from "date-fns";
import { AbsoluteUrl } from "shared";
import { AccessTokenGateway } from "../../../../domain/core/ports/AccessTokenGateway";
import { RateLimiter } from "../../../../domain/core/ports/RateLimiter";
import {
  RetryableError,
  RetryStrategy,
} from "../../../../domain/core/ports/RetryStrategy";
import {
  LaBonneBoiteAPI,
  LaBonneBoiteRequestParams,
} from "../../../../domain/immersionOffer/ports/LaBonneBoiteAPI";
import {
  LaBonneBoiteCompanyProps,
  LaBonneBoiteCompanyVO,
} from "../../../../domain/immersionOffer/valueObjects/LaBonneBoiteCompanyVO";
import {
  createAxiosInstance,
  isRetryableError,
  logAxiosError,
} from "../../../../utils/axiosUtils";
import { createLogger } from "../../../../utils/logger";

const logger = createLogger(__filename);

type HttpGetLaBonneBoiteCompanyParams = {
  commune_id?: string; // INSEE of municipality near which we are looking
  departments?: number[]; // List of departments
  contract?: "dpae" | "alternance";
  latitude?: number; // required if commune_id and deparments are undefined
  longitude?: number; // required if commune_id and deparments are undefined
  distance?: number; // in KM, used only if (latitude, longitude) is given
  rome_codes: string;
  naf_codes?: string; // list of naf codes separeted with a comma, eg : "9499Z,5610C"
  headcount?: "all" | "big" | "small"; // Size of company (big if more than 50 employees). Default to "all"
  page: number; // Page index
  page_size: number; // Nb of results per page
  sort?: "score" | "distance";
};

type HttpGetLaBonneBoiteCompanyResponse = {
  companies: LaBonneBoiteCompanyProps[];
  match_rome_code: string;
  match_rome_label: string;
  match_rome_slug: string;
  companies_count: number;
  url: string;
  rome_code: string;
  rome_label: string;
};

const deduplicateLaBonneBoiteCompanies = (
  companies: LaBonneBoiteCompanyProps[],
): LaBonneBoiteCompanyProps[] => {
  const companieSirets = companies.map((company) => company.siret);
  return companies.filter(
    (company, companyIndex) =>
      companieSirets.indexOf(company.siret) === companyIndex,
  );
};

const MAX_PAGE_SIZE = 100;
export class HttpLaBonneBoiteAPI implements LaBonneBoiteAPI {
  private urlGetCompany: AbsoluteUrl;

  constructor(
    readonly peApiUrl: AbsoluteUrl,
    private readonly accessTokenGateway: AccessTokenGateway,
    private readonly poleEmploiClientId: string,
    private readonly rateLimiter: RateLimiter,
    private readonly retryStrategy: RetryStrategy,
  ) {
    this.urlGetCompany = `${peApiUrl}/partenaire/labonneboite/v1/company/`;
  }

  public async searchCompanies(
    searchParams: LaBonneBoiteRequestParams,
  ): Promise<LaBonneBoiteCompanyVO[]> {
    const requestParams: HttpGetLaBonneBoiteCompanyParams = {
      distance: searchParams.distance_km,
      longitude: searchParams.lon,
      latitude: searchParams.lat,
      page: 1,
      page_size: MAX_PAGE_SIZE,
      rome_codes: searchParams.rome,
    };
    const allCompaniesProps = await this.recursivelyGetAllCompanies(
      requestParams,
      [],
    );
    const deduplicatedCompaniesProps =
      deduplicateLaBonneBoiteCompanies(allCompaniesProps);
    logger.info(
      `LBB fetched ${allCompaniesProps.length} companies, amongst which ${deduplicatedCompaniesProps.length} only are different.`,
    );
    return deduplicatedCompaniesProps.map(
      (props: LaBonneBoiteCompanyProps) => new LaBonneBoiteCompanyVO(props),
    );
  }
  private async getCompanyResponse(
    params: HttpGetLaBonneBoiteCompanyParams,
  ): Promise<AxiosResponse<HttpGetLaBonneBoiteCompanyResponse>> {
    return this.retryStrategy.apply(async () => {
      try {
        const axios = createAxiosInstance(logger);
        const response = await this.rateLimiter.whenReady(async () => {
          const accessToken = await this.accessTokenGateway.getAccessToken(
            `application_${this.poleEmploiClientId} api_labonneboitev1`,
          );
          return axios.get(this.urlGetCompany, {
            headers: {
              Authorization: createAuthorization(accessToken.access_token),
            },
            timeout: secondsToMilliseconds(10),
            params,
          });
        });
        return response;
      } catch (error: any) {
        if (isRetryableError(logger, error)) throw new RetryableError(error);
        logAxiosError(logger, error);
        throw error;
      }
    });
  }

  private async recursivelyGetAllCompanies(
    params: HttpGetLaBonneBoiteCompanyParams,
    allCompanies: LaBonneBoiteCompanyProps[],
  ): Promise<LaBonneBoiteCompanyProps[]> {
    try {
      const companyResponse = await this.getCompanyResponse(params);

      const updatedAllCompanies = [
        ...allCompanies,
        ...companyResponse.data.companies,
      ];

      const wasLastPage =
        companyResponse.data.companies_count === updatedAllCompanies.length;

      return wasLastPage
        ? updatedAllCompanies
        : await this.recursivelyGetAllCompanies(
            { ...params, page: params.page + 1 },
            updatedAllCompanies,
          );
    } catch (error: any) {
      logger.error(
        "Error while recursively calling LBB API with params ",
        params,
        " : ",
        error,
      );
      return allCompanies;
    }
  }
}

const createAuthorization = (accessToken: string) => `Bearer ${accessToken}`;
