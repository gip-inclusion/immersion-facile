import promClient from "prom-client";
import { FeatureFlags } from "../../../shared/featureFlags";
import {
  SearchImmersionRequestDto,
  searchImmersionRequestSchema,
  SearchImmersionResultDto,
} from "../../../shared/SearchImmersionDto";
import { ApiConsumer } from "../../../shared/tokens/ApiConsumer";
import { createLogger } from "../../../utils/logger";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { UseCase } from "../../core/UseCase";
import { ImmersionOfferRepository } from "../ports/ImmersionOfferRepository";
import { LaBonneBoiteAPI } from "../ports/LaBonneBoiteAPI";
import { SearchesMadeRepository } from "../ports/SearchesMadeRepository";

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

const histogramSearchImmersionStoredCount = new promClient.Histogram({
  name: "search_immersion_stored_result_count",
  help: "Histogram of the number of result returned from storage",
  buckets: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
});

const THRESHOLD_TO_FETCH_LBB = 15;

export class SearchImmersion extends UseCase<
  SearchImmersionRequestDto,
  SearchImmersionResultDto[],
  ApiConsumer
> {
  constructor(
    private readonly searchesMadeRepository: SearchesMadeRepository,
    private readonly immersionOfferRepository: ImmersionOfferRepository,
    private readonly laBonneBoiteAPI: LaBonneBoiteAPI,
    private readonly uuidGenerator: UuidGenerator,
    private readonly featureFlags: FeatureFlags,
  ) {
    super();
  }

  inputSchema = searchImmersionRequestSchema;

  public async _execute(
    params: SearchImmersionRequestDto,
    apiConsumer: ApiConsumer,
  ): Promise<SearchImmersionResultDto[]> {
    const searchMade = {
      rome: params.rome,
      nafDivision: params.nafDivision,
      siret: params.siret,
      lat: params.location.lat,
      lon: params.location.lon,
      distance_km: params.distance_km,
    };
    const searchMadeEntity = {
      ...searchMade,
      id: this.uuidGenerator.new(),
    };
    await this.searchesMadeRepository.insertSearchMade(searchMadeEntity);
    const apiConsumerName = apiConsumer?.consumer;

    const resultsFromStorage =
      await this.immersionOfferRepository.getFromSearch(
        searchMade,
        /* withContactDetails= */ apiConsumerName !== undefined,
      );

    histogramSearchImmersionStoredCount.observe(resultsFromStorage.length);

    if (!this.featureFlags.enableLBBFetchOnSearch) return resultsFromStorage;

    if (resultsFromStorage.length >= THRESHOLD_TO_FETCH_LBB) {
      counterSearchImmersionLBBRequestsSkipped.inc();
      return resultsFromStorage;
    }

    try {
      counterSearchImmersionLBBRequestsTotal.inc();
      await this.updateStorageByCallingLaBonneBoite(params);
    } catch (e: any) {
      logger.warn(e, "LBB fetch error");
      counterSearchImmersionLBBRequestsError.inc();
    }

    return this.immersionOfferRepository.getFromSearch(
      searchMade,
      /* withContactDetails= */ apiConsumerName !== undefined,
    );
  }

  private async updateStorageByCallingLaBonneBoite(
    params: SearchImmersionRequestDto,
  ) {
    const resultsFromLaBonneBoite = await this.laBonneBoiteAPI.searchCompanies({
      ...params,
      ...params.location,
    });

    const llbResultsConvertedToEstablishmentAggregates =
      resultsFromLaBonneBoite.map((lbbCompanyVO) =>
        lbbCompanyVO.toEstablishmentAggregate(this.uuidGenerator),
      );

    await this.immersionOfferRepository.insertEstablishmentAggregates(
      llbResultsConvertedToEstablishmentAggregates,
    );
  }
}
