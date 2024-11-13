import { uniqBy } from "ramda";
import {
  path,
  AppellationAndRomeDto,
  AppellationCode,
  GeoPositionDto,
  RomeCode,
  SearchResultDto,
  SiretDto,
  conflictErrorSiret,
  errors,
  pathEq,
  replaceArrayElement,
} from "shared";
import { distanceBetweenCoordinatesInMeters } from "../../../utils/distanceBetweenCoordinatesInMeters";
import { EstablishmentAggregate } from "../entities/EstablishmentEntity";
import { hasSearchMadeGeoParams } from "../entities/SearchMadeEntity";
import {
  EstablishmentAggregateFilters,
  EstablishmentAggregateRepository,
  SearchImmersionParams,
  SearchImmersionResult,
  UpdateEstablishmentsWithInseeDataParams,
} from "../ports/EstablishmentAggregateRepository";

export const TEST_ROME_LABEL = "test_rome_label";

export class InMemoryEstablishmentAggregateRepository
  implements EstablishmentAggregateRepository
{
  #establishmentAggregates: EstablishmentAggregate[] = [];

  public async delete(siret: SiretDto): Promise<void> {
    const formEstablishmentIndex = this.#establishmentAggregates.findIndex(
      (formEstablishment) => formEstablishment.establishment.siret === siret,
    );
    if (formEstablishmentIndex === -1)
      throw errors.establishment.notFound({ siret });
    this.#establishmentAggregates.splice(formEstablishmentIndex, 1);
  }

  // for test purposes only :
  public get establishmentAggregates() {
    return this.#establishmentAggregates;
  }

  public set establishmentAggregates(establishmentAggregates: EstablishmentAggregate[]) {
    this.#establishmentAggregates = establishmentAggregates;
  }

  public async getEstablishmentAggregateBySiret(
    siret: SiretDto,
  ): Promise<EstablishmentAggregate | undefined> {
    return this.#establishmentAggregates.find(
      pathEq("establishment.siret", siret),
    );
  }

  public async getEstablishmentAggregatesByFilters({
    userId,
  }: EstablishmentAggregateFilters): Promise<EstablishmentAggregate[]> {
    return this.#establishmentAggregates.filter((establishmentAggregate) =>
      establishmentAggregate.userRights.some(
        (userRight) => userRight.userId === userId,
      ),
    );
  }

  public async getOffersAsAppellationAndRomeDtosBySiret(
    siret: string,
  ): Promise<AppellationAndRomeDto[]> {
    return (
      this.establishmentAggregates
        .find(pathEq("establishment.siret", siret))
        ?.offers.map((offer) => ({
          romeCode: offer.romeCode,
          appellationCode: offer.appellationCode?.toString() ?? "", // Should not be undefined though
          romeLabel: offer.romeLabel,
          appellationLabel: offer.appellationLabel,
        })) ?? []
    );
  }

  public async getSearchImmersionResultDtoBySearchQuery(
    siret: SiretDto,
    appellationCode: AppellationCode,
  ): Promise<SearchResultDto | undefined> {
    const aggregate = this.establishmentAggregates.find(
      (aggregate) => aggregate.establishment.siret === siret,
    );
    if (!aggregate) return;
    const offer = aggregate.offers.find(
      (offer) => offer.appellationCode === appellationCode,
    );
    if (!offer) return;

    const { isSearchable: _, ...rest } =
      buildSearchImmersionResultDtoForOneEstablishmentAndOneRomeAndFirstLocation(
        {
          establishmentAgg: aggregate,
          searchedAppellationCode: offer.appellationCode,
        },
      );
    return rest;
  }

  public getSiretOfEstablishmentsToSuggestUpdate(): Promise<SiretDto[]> {
    throw new Error(
      "Method not implemented : getSiretOfEstablishmentsToSuggestUpdate, you can use PG implementation instead",
    );
  }

  public async getSiretsOfEstablishmentsNotCheckedAtInseeSince(
    checkDate: Date,
    maxResults: number,
  ): Promise<SiretDto[]> {
    return this.#establishmentAggregates
      .filter(
        (establishmentAggregate) =>
          !establishmentAggregate.establishment.lastInseeCheckDate ||
          establishmentAggregate.establishment.lastInseeCheckDate < checkDate,
      )
      .map(({ establishment }) => establishment.siret)
      .slice(0, maxResults);
  }

  public async getSiretsOfEstablishmentsWithRomeCode(
    rome: string,
  ): Promise<SiretDto[]> {
    return this.#establishmentAggregates
      .filter(
        (aggregate) =>
          !!aggregate.offers.find((offer) => offer.romeCode === rome),
      )
      .map(path("establishment.siret"));
  }

  public async hasEstablishmentAggregateWithSiret(
    siret: string,
  ): Promise<boolean> {
    if (siret === conflictErrorSiret)
      throw errors.establishment.conflictError({ siret });
    return !!this.#establishmentAggregates.find(
      (aggregate) => aggregate.establishment.siret === siret,
    );
  }

  public async insertEstablishmentAggregate(aggregate: EstablishmentAggregate) {
    this.#establishmentAggregates = [
      ...this.#establishmentAggregates,
      ...[aggregate],
    ];
  }

  public async markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerMonth(): Promise<number> {
    // not implemented because this method is used only in a script,
    // and the use case consists only in a PG query
    throw new Error("NOT implemented");
  }

  public async searchImmersionResults({
    searchMade,
    fitForDisabledWorkers,
    maxResults,
  }: SearchImmersionParams): Promise<SearchImmersionResult[]> {
    return this.#establishmentAggregates
      .filter((aggregate) => aggregate.establishment.isOpen)
      .filter((aggregate) =>
        searchMade.establishmentSearchableBy
          ? aggregate.establishment.searchableBy[
              searchMade.establishmentSearchableBy
            ]
          : true,
      )
      .filter((agg) =>
        fitForDisabledWorkers !== undefined
          ? agg.establishment.fitForDisabledWorkers === fitForDisabledWorkers
          : true,
      )
      .flatMap((aggregate) =>
        uniqBy((offer) => offer.romeCode, aggregate.offers)
          .filter(
            (offer) =>
              !searchMade.appellationCodes ||
              searchMade.appellationCodes.includes(offer.appellationCode),
          )
          .map((offer) =>
            buildSearchImmersionResultDtoForOneEstablishmentAndOneRomeAndFirstLocation(
              {
                establishmentAgg: aggregate,
                searchedAppellationCode: offer.appellationCode,
                ...(hasSearchMadeGeoParams(searchMade)
                  ? {
                      position: {
                        lat: searchMade.lat,
                        lon: searchMade.lon,
                      },
                    }
                  : {}),
              },
            ),
          ),
      )
      .slice(0, maxResults);
  }

  public async updateEstablishmentAggregate(aggregate: EstablishmentAggregate) {
    const aggregateIndex = this.#establishmentAggregates.findIndex(
      pathEq("establishment.siret", aggregate.establishment.siret),
    );
    if (aggregateIndex === -1)
      throw errors.establishment.notFound({
        siret: aggregate.establishment.siret,
      });
    this.#establishmentAggregates = replaceArrayElement(
      this.#establishmentAggregates,
      aggregateIndex,
      aggregate,
    );
  }

  public async updateEstablishmentsWithInseeData(
    inseeCheckDate: Date,
    params: UpdateEstablishmentsWithInseeDataParams,
  ): Promise<void> {
    this.#establishmentAggregates = this.#establishmentAggregates.map(
      (aggregate) => {
        const newValues = params[aggregate.establishment.siret];
        return newValues
          ? {
              ...aggregate,
              establishment: {
                ...aggregate.establishment,
                ...newValues,
                lastInseeCheckDate: inseeCheckDate,
              },
            }
          : aggregate;
      },
    );
  }
}

const buildSearchImmersionResultDtoForOneEstablishmentAndOneRomeAndFirstLocation =
  ({
    establishmentAgg,
    searchedAppellationCode,
    position,
  }: {
    establishmentAgg: EstablishmentAggregate;
    searchedAppellationCode: AppellationCode;
    position?: GeoPositionDto;
  }): SearchImmersionResult => {
    const romeCode =
      establishmentAgg.offers.find(
        (offer) => offer.appellationCode === searchedAppellationCode,
      )?.romeCode ?? "no-offer-matched";

    return {
      address: establishmentAgg.establishment.locations[0].address,
      naf: establishmentAgg.establishment.nafDto.code,
      nafLabel: establishmentAgg.establishment.nafDto.nomenclature,
      name: establishmentAgg.establishment.name,
      customizedName: establishmentAgg.establishment.customizedName,
      rome: romeCode,
      romeLabel: TEST_ROME_LABEL,
      establishmentScore: establishmentAgg.establishment.score,
      appellations: establishmentAgg.offers
        .filter((immersionOffer) => immersionOffer.romeCode === romeCode)
        .map((immersionOffer) => ({
          appellationLabel: immersionOffer.appellationLabel,
          appellationCode: immersionOffer.appellationCode,
        })),
      siret: establishmentAgg.establishment.siret,
      voluntaryToImmersion: establishmentAgg.establishment.voluntaryToImmersion,
      contactMode: establishmentAgg.establishment.contactMethod,
      numberOfEmployeeRange:
        establishmentAgg.establishment.numberEmployeesRange,
      website: establishmentAgg.establishment?.website,
      additionalInformation:
        establishmentAgg.establishment?.additionalInformation,
      distance_m: position
        ? distanceBetweenCoordinatesInMeters(
            establishmentAgg.establishment.locations[0].position.lat,
            establishmentAgg.establishment.locations[0].position.lon,
            position.lat,
            position.lon,
          )
        : undefined,
      position: establishmentAgg.establishment.locations[0].position,
      isSearchable: establishmentAgg.establishment.isSearchable,
      nextAvailabilityDate: establishmentAgg.establishment.nextAvailabilityDate,
      locationId: establishmentAgg.establishment.locations[0].id,
      updatedAt: establishmentAgg.establishment.updatedAt?.toISOString(),
      createdAt: establishmentAgg.establishment.createdAt.toISOString(),
    };
  };

export const establishmentAggregateToSearchResultByRomeForFirstLocation = (
  establishmentAggregate: EstablishmentAggregate,
  romeCode: RomeCode,
  distance_m?: number,
  customScore?: number,
): SearchResultDto => ({
  rome: romeCode,
  establishmentScore: customScore ?? establishmentAggregate.establishment.score,
  naf: establishmentAggregate.establishment.nafDto.code,
  nafLabel: establishmentAggregate.establishment.nafDto.nomenclature,
  siret: establishmentAggregate.establishment.siret,
  name: establishmentAggregate.establishment.name,
  numberOfEmployeeRange:
    establishmentAggregate.establishment.numberEmployeesRange,
  voluntaryToImmersion:
    establishmentAggregate.establishment.voluntaryToImmersion,
  additionalInformation:
    establishmentAggregate.establishment.additionalInformation,
  position: establishmentAggregate.establishment.locations[0].position,
  address: establishmentAggregate.establishment.locations[0].address,
  locationId: establishmentAggregate.establishment.locations[0].id,
  contactMode: establishmentAggregate.establishment.contactMethod,
  distance_m,
  romeLabel: TEST_ROME_LABEL,
  website: establishmentAggregate.establishment.website,
  appellations: establishmentAggregate.offers
    .filter((offer) => offer.romeCode === romeCode)
    .map((offer) => ({
      appellationCode: offer.appellationCode,
      appellationLabel: offer.appellationLabel,
    })),
  updatedAt: establishmentAggregate.establishment.updatedAt?.toISOString(),
  createdAt: establishmentAggregate.establishment.createdAt.toISOString(),
});
