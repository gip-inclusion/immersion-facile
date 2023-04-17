import { addDays } from "date-fns";
import { prop, propEq } from "ramda";
import {
  SearchImmersionQueryParamsDto,
  searchImmersionQueryParamsSchema,
} from "shared";
import {
  counterSearchImmersionLBBRequestsError,
  counterSearchImmersionLBBRequestsSkipped,
  counterSearchImmersionLBBRequestsTotal,
} from "../../../utils/counters";
import { createLogger } from "../../../utils/logger";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { LaBonneBoiteRequestEntity } from "../entities/LaBonneBoiteRequestEntity";
import { OfferWithSiret } from "../ports/EstablishmentAggregateRepository";
import {
  LaBonneBoiteAPI,
  LaBonneBoiteRequestParams,
} from "../ports/LaBonneBoiteAPI";
import { LaBonneBoiteCompanyVO } from "../valueObjects/LaBonneBoiteCompanyVO";

const logger = createLogger(__filename);

const LBB_DISTANCE_KM_REQUEST_PARAM = 50;
export class CallLaBonneBoiteAndUpdateRepositories extends TransactionalUseCase<
  SearchImmersionQueryParamsDto,
  void
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly laBonneBoiteAPI: LaBonneBoiteAPI,
    private readonly timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
  }

  inputSchema = searchImmersionQueryParamsSchema;

  public async _execute(
    searchImmersionRequestDto: SearchImmersionQueryParamsDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const { rome, latitude, longitude, distance_km } =
      searchImmersionRequestDto;

    if (!rome) return;

    const requestParams: LaBonneBoiteRequestParams = {
      rome,
      lon: longitude,
      lat: latitude,
      distance_km,
    };

    const shouldCallLaBonneBoite: boolean =
      await this.laBonneBoiteHasNotBeenRequestedWithThisRomeAndThisAreaInTheLastMonth(
        uow,
        requestParams,
      );

    if (!shouldCallLaBonneBoite) {
      counterSearchImmersionLBBRequestsSkipped.inc();
      logger.info(
        {
          rome,
          latitude,
          longitude,
          distance_km,
        },
        "searchImmersionLBBRequestsSkipped",
      );
      return;
    }

    const { lbbRequestEntity, relevantCompanies } =
      await this.requestLaBonneBoite({
        ...requestParams,
        distance_km: LBB_DISTANCE_KM_REQUEST_PARAM,
      });

    await uow.laBonneBoiteRequestRepository.insertLaBonneBoiteRequest(
      lbbRequestEntity,
    );

    if (!relevantCompanies || relevantCompanies.length === 0) return;

    const lbbSirets = relevantCompanies.map(prop("siret"));
    const siretGroupedByDataSource =
      await uow.establishmentAggregateRepository.groupEstablishmentSiretsByDataSource(
        lbbSirets,
      );

    const existingEstablishments = [
      ...(siretGroupedByDataSource.api_labonneboite ?? []),
      ...(siretGroupedByDataSource.form ?? []),
    ];
    const newRelevantCompanies = relevantCompanies.filter(
      (company) => !existingEstablishments.includes(company.siret),
    );

    await this.insertRelevantCompaniesInRepositories(uow, newRelevantCompanies);

    if (!siretGroupedByDataSource.api_labonneboite) return;

    const existingCompaniesWithSameRome =
      await uow.establishmentAggregateRepository.getSiretsOfEstablishmentsWithRomeCode(
        requestParams.rome,
      );
    const existingCompaniesSiretsFromLaBonneBoiteWithoutThisRome =
      siretGroupedByDataSource.api_labonneboite.filter(
        (siret) => !existingCompaniesWithSameRome.includes(siret),
      );

    const immersionOffersWithSiretsToAdd: OfferWithSiret[] =
      existingCompaniesSiretsFromLaBonneBoiteWithoutThisRome.map((siret) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we know it's siret is within relevantCompanies
        const company = relevantCompanies.find(propEq("siret", siret))!;
        return {
          siret: company.siret,
          createdAt: this.timeGateway.now(),
          romeCode: company.props.matched_rome_code,
          score: company.props.stars,
        };
      });
    await uow.establishmentAggregateRepository.createImmersionOffersToEstablishments(
      immersionOffersWithSiretsToAdd,
    );
  }

  private async requestLaBonneBoite(
    requestParams: LaBonneBoiteRequestParams,
  ): Promise<{
    lbbRequestEntity: LaBonneBoiteRequestEntity;
    relevantCompanies?: LaBonneBoiteCompanyVO[];
  }> {
    const requestedAt = this.timeGateway.now();
    try {
      counterSearchImmersionLBBRequestsTotal.inc();
      logger.info({ requestParams }, "searchImmersionLBBRequestsTotal");
      const laBonneBoiteCompanies = await this.laBonneBoiteAPI.searchCompanies(
        requestParams,
      );

      const laBonneBoiteRelevantCompanies = laBonneBoiteCompanies.filter(
        (company) => company.isCompanyRelevant(),
      );
      logger.info(
        {
          requestParams,
          requestedAt,
          laBonneBoiteRelevantCompaniesQty:
            laBonneBoiteRelevantCompanies.length,
        },
        "searchImmersionLBBRequestsSuccess",
      );

      return {
        relevantCompanies: laBonneBoiteRelevantCompanies,
        lbbRequestEntity: {
          requestedAt,
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
      const error = e?.message ?? "error without message";
      counterSearchImmersionLBBRequestsError.inc();
      logger.warn(
        { requestParams, requestedAt, error },
        "searchImmersionLBBRequestsError",
      );

      return {
        lbbRequestEntity: {
          requestedAt: this.timeGateway.now(),
          params: requestParams,
          result: {
            error,
            number0fEstablishments: null,
            numberOfRelevantEstablishments: null,
          },
        },
      };
    }
  }

  private async insertRelevantCompaniesInRepositories(
    uow: UnitOfWork,
    companies: LaBonneBoiteCompanyVO[],
  ) {
    const llbResultsConvertedToEstablishmentAggregates = companies.map(
      (company) => company.toEstablishmentAggregate(this.timeGateway),
    );

    await uow.establishmentAggregateRepository.insertEstablishmentAggregates(
      llbResultsConvertedToEstablishmentAggregates,
    );
  }

  private async laBonneBoiteHasNotBeenRequestedWithThisRomeAndThisAreaInTheLastMonth(
    uow: UnitOfWork,
    requestParams: LaBonneBoiteRequestParams,
  ) {
    const closestRequestParamsWithSameRomeInTheMonth: {
      params: LaBonneBoiteRequestParams;
      distanceToPositionKm: number;
    } | null = !requestParams.rome
      ? null
      : await uow.laBonneBoiteRequestRepository.getClosestRequestParamsWithThisRomeSince(
          {
            rome: requestParams.rome,
            position: { lat: requestParams.lat, lon: requestParams.lon },
            since: addDays(this.timeGateway.now(), -30),
          },
        );

    if (closestRequestParamsWithSameRomeInTheMonth === null) return true;

    return (
      closestRequestParamsWithSameRomeInTheMonth.distanceToPositionKm >
      requestParams.distance_km
    );
  }
}
