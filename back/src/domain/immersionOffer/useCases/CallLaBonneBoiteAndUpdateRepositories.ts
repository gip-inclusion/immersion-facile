import { addDays } from "date-fns";
import promClient from "prom-client";
import {
  SearchImmersionRequestDto,
  searchImmersionRequestSchema,
} from "../../../shared/SearchImmersionDto";
import { createLogger } from "../../../utils/logger";
import { Clock } from "../../core/ports/Clock";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { UseCase } from "../../core/UseCase";
import { LaBonneBoiteRequestEntity } from "../entities/LaBonneBoiteRequestEntity";
import { ImmersionOfferRepository } from "../ports/ImmersionOfferRepository";
import {
  LaBonneBoiteAPI,
  LaBonneBoiteRequestParams,
} from "../ports/LaBonneBoiteAPI";
import { LaBonneBoiteRequestRepository } from "../ports/LaBonneBoiteRequestRepository";
import { LaBonneBoiteCompanyVO } from "../valueObjects/LaBonneBoiteCompanyVO";

const logger = createLogger(__filename);

const counterSearchImmersionLBBRequestsTotal = new promClient.Counter({
  name: "search_immersion_lbb_requests_total",
  help: "The total count of LBB request made in the search immersions use case",
});

const counterSearchImmersionLBBRequestsError = new promClient.Counter({
  name: "search_immersion_lbb_requests_error",
  help: "The total count of failed LBB request made in the search immersions use case",
});

const counterSearchImmersionLBBRequestsSkipped = new promClient.Counter({
  name: "search_immersion_lbb_requests_skipped",
  help: "The total count of skipped LBB request made in the search immersions use case",
});

const LBB_DISTANCE_KM_REQUEST_PARAM = 50;
export class CallLaBonneBoiteAndUpdateRepositories extends UseCase<
  SearchImmersionRequestDto,
  void
> {
  constructor(
    private readonly immersionOfferRepository: ImmersionOfferRepository,
    private readonly laBonneBoiteRequestRepository: LaBonneBoiteRequestRepository,
    private readonly laBonneBoiteAPI: LaBonneBoiteAPI,
    private readonly uuidGenerator: UuidGenerator,
    private readonly clock: Clock,
  ) {
    super();
  }
  inputSchema = searchImmersionRequestSchema;

  public async _execute(
    searchImmersionRequestDto: SearchImmersionRequestDto,
  ): Promise<void> {
    if (!searchImmersionRequestDto.rome) return;

    const requestParams: LaBonneBoiteRequestParams = {
      rome: searchImmersionRequestDto.rome,
      lon: searchImmersionRequestDto.location.lon,
      lat: searchImmersionRequestDto.location.lat,
      distance_km: searchImmersionRequestDto.distance_km,
    };

    const shouldCallLaBonneBoite: boolean =
      await this.laBonneBoiteHasNotBeenRequestedWithThisRomeAndThisAreaInTheLastMonth(
        requestParams,
      );

    if (!shouldCallLaBonneBoite) {
      counterSearchImmersionLBBRequestsSkipped.inc();
      return;
    }

    const { lbbRequestEntity, relevantCompanies } =
      await this.requestLaBonneBoite({
        ...requestParams,
        distance_km: LBB_DISTANCE_KM_REQUEST_PARAM,
      });

    await this.laBonneBoiteRequestRepository.insertLaBonneBoiteRequest(
      lbbRequestEntity,
    );
    if (relevantCompanies) {
      const existingFormEstablishmentsSirets =
        await this.immersionOfferRepository.getSiretOfEstablishmentsFromFormSource();

      const newRelevantCompanies = relevantCompanies.filter(
        (company) => !existingFormEstablishmentsSirets.includes(company.siret),
      );

      await this.insertRelevantCompaniesInRepositories(newRelevantCompanies);
    }
  }

  private async requestLaBonneBoite(
    requestParams: LaBonneBoiteRequestParams,
  ): Promise<{
    lbbRequestEntity: LaBonneBoiteRequestEntity;
    relevantCompanies?: LaBonneBoiteCompanyVO[];
  }> {
    try {
      counterSearchImmersionLBBRequestsTotal.inc();
      const laBonneBoiteCompanies = await this.laBonneBoiteAPI.searchCompanies(
        requestParams,
      );
      const laBonneBoiteRelevantCompanies = laBonneBoiteCompanies.filter(
        (company) => company.isCompanyRelevant(),
      );
      return {
        relevantCompanies: laBonneBoiteRelevantCompanies,
        lbbRequestEntity: {
          requestedAt: this.clock.now(),
          params: requestParams,
          result: {
            error: null,
            number0fEstablishments: laBonneBoiteCompanies.length,
            numberOfRelevantEstablishments:
              laBonneBoiteRelevantCompanies.length,
          },
        },
      };
    } catch (e: any) {
      logger.warn(e, "LBB fetch error");
      counterSearchImmersionLBBRequestsError.inc();
      return {
        lbbRequestEntity: {
          requestedAt: this.clock.now(),
          params: requestParams,
          result: {
            error: e?.message ?? "erorr without message",
            number0fEstablishments: null,
            numberOfRelevantEstablishments: null,
          },
        },
      };
    }
  }
  private async insertRelevantCompaniesInRepositories(
    companies: LaBonneBoiteCompanyVO[],
  ) {
    const updatedAt = undefined;
    const llbResultsConvertedToEstablishmentAggregates = companies.map(
      (company) =>
        company.toEstablishmentAggregate(this.uuidGenerator, updatedAt),
    );

    await this.immersionOfferRepository.insertEstablishmentAggregates(
      llbResultsConvertedToEstablishmentAggregates,
    );
  }

  private async laBonneBoiteHasNotBeenRequestedWithThisRomeAndThisAreaInTheLastMonth(
    requestParams: LaBonneBoiteRequestParams,
  ) {
    const closestRequestParamsWithSameRomeInTheMonth: {
      params: LaBonneBoiteRequestParams;
      distanceToPositionKm: number;
    } | null = !requestParams.rome
      ? null
      : await this.laBonneBoiteRequestRepository.getClosestRequestParamsWithThisRomeSince(
          {
            rome: requestParams.rome,
            position: { lat: requestParams.lat, lon: requestParams.lon },
            since: addDays(this.clock.now(), -30),
          },
        );

    if (closestRequestParamsWithSameRomeInTheMonth === null) return true;

    return (
      closestRequestParamsWithSameRomeInTheMonth.distanceToPositionKm >
      requestParams.distance_km
    );
  }
}
