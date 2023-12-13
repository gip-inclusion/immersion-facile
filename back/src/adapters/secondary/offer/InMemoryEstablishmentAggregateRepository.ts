import { uniqBy } from "ramda";
import {
  AppellationAndRomeDto,
  AppellationCode,
  conflictErrorSiret,
  GeoPositionDto,
  path,
  pathEq,
  replaceArrayElement,
  SearchResultDto,
  SiretDto,
} from "shared";
import { EstablishmentAggregate } from "../../../domain/offer/entities/EstablishmentEntity";
import {
  EstablishmentAggregateRepository,
  establishmentNotFoundErrorMessage,
  SearchImmersionParams,
  SearchImmersionResult,
  UpdateEstablishmentsWithInseeDataParams,
} from "../../../domain/offer/ports/EstablishmentAggregateRepository";
import { distanceBetweenCoordinatesInMeters } from "../../../utils/distanceBetweenCoordinatesInMeters";
import { ConflictError, NotFoundError } from "../../primary/helpers/httpErrors";

export const TEST_ROME_LABEL = "test_rome_label";
export const TEST_APPELLATION_LABEL = "test_appellation_label";
export const TEST_APPELLATION_CODE = "12345";
export const TEST_POSITION = { lat: 43.8666, lon: 8.3333 };

export class InMemoryEstablishmentAggregateRepository
  implements EstablishmentAggregateRepository
{
  #establishmentAggregates: EstablishmentAggregate[] = [];

  public async delete(siret: SiretDto): Promise<void> {
    const formEstablishmentIndex = this.#establishmentAggregates.findIndex(
      (formEstablishment) => formEstablishment.establishment.siret === siret,
    );
    if (formEstablishmentIndex === -1)
      throw new NotFoundError(establishmentNotFoundErrorMessage(siret));
    this.#establishmentAggregates.splice(formEstablishmentIndex, 1);
  }

  // for test purposes only :
  public get establishmentAggregates() {
    return this.#establishmentAggregates;
  }

  public set establishmentAggregates(
    establishmentAggregates: EstablishmentAggregate[],
  ) {
    this.#establishmentAggregates = establishmentAggregates;
  }

  public async getEstablishmentAggregateBySiret(
    siret: SiretDto,
  ): Promise<EstablishmentAggregate | undefined> {
    return this.#establishmentAggregates.find(
      pathEq("establishment.siret", siret),
    );
  }

  public async getOffersAsAppellationDtoEstablishment(
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

  public async getSearchImmersionResultDtoBySiretAndAppellationCode(
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
    const { isSearchable, ...rest } =
      buildSearchImmersionResultDtoForOneEstablishmentAndOneRome({
        establishmentAgg: aggregate,
        searchedAppellationCode: offer.appellationCode,
      });
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

  public async hasEstablishmentWithSiret(siret: string): Promise<boolean> {
    if (siret === conflictErrorSiret)
      throw new ConflictError(
        `Establishment with siret ${siret} already in db`,
      );
    return !!this.#establishmentAggregates.find(
      (aggregate) => aggregate.establishment.siret === siret,
    );
  }

  public async insertEstablishmentAggregates(
    aggregates: EstablishmentAggregate[],
  ) {
    this.#establishmentAggregates = [
      ...this.#establishmentAggregates,
      ...aggregates,
    ];
  }

  public async markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerWeek(): Promise<number> {
    // not implemented because this method is used only in a script,
    // and the use case consists only in a PG query
    throw new Error("NOT implemented");
  }

  public async searchImmersionResults({
    searchMade: { lat, lon, appellationCodes },
    maxResults,
  }: SearchImmersionParams): Promise<SearchImmersionResult[]> {
    return this.#establishmentAggregates
      .filter((aggregate) => aggregate.establishment.isOpen)
      .flatMap((aggregate) =>
        uniqBy((offer) => offer.romeCode, aggregate.offers)
          .filter(
            (offer) =>
              !appellationCodes ||
              appellationCodes.includes(offer.appellationCode),
          )
          .map((offer) =>
            buildSearchImmersionResultDtoForOneEstablishmentAndOneRome({
              establishmentAgg: aggregate,
              searchedAppellationCode: offer.appellationCode,
              position: {
                lat,
                lon,
              },
            }),
          ),
      )
      .slice(0, maxResults);
  }

  public async updateEstablishmentAggregate(aggregate: EstablishmentAggregate) {
    const aggregateIndex = this.#establishmentAggregates.findIndex(
      pathEq("establishment.siret", aggregate.establishment.siret),
    );
    if (aggregateIndex === -1)
      throw new NotFoundError(
        `We do not have an establishment with siret ${aggregate.establishment.siret} to update`,
      );
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

const buildSearchImmersionResultDtoForOneEstablishmentAndOneRome = ({
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
    address: establishmentAgg.establishment.address,
    naf: establishmentAgg.establishment.nafDto.code,
    nafLabel: establishmentAgg.establishment.nafDto.nomenclature,
    name: establishmentAgg.establishment.name,
    customizedName: establishmentAgg.establishment.customizedName,
    rome: romeCode,
    romeLabel: TEST_ROME_LABEL,
    appellations: establishmentAgg.offers
      .filter((immersionOffer) => immersionOffer.romeCode === romeCode)
      .map((immersionOffer) => ({
        appellationLabel: immersionOffer.appellationLabel,
        appellationCode: immersionOffer.appellationCode,
      })),
    siret: establishmentAgg.establishment.siret,
    voluntaryToImmersion: establishmentAgg.establishment.voluntaryToImmersion,
    contactMode: establishmentAgg.contact?.contactMethod,
    numberOfEmployeeRange: establishmentAgg.establishment.numberEmployeesRange,
    website: establishmentAgg.establishment?.website,
    additionalInformation:
      establishmentAgg.establishment?.additionalInformation,
    distance_m: position
      ? distanceBetweenCoordinatesInMeters(
          establishmentAgg.establishment.position.lat,
          establishmentAgg.establishment.position.lon,
          position.lat,
          position.lon,
        )
      : undefined,
    position: establishmentAgg.establishment.position,
    isSearchable: establishmentAgg.establishment.isSearchable,
    nextAvailabilityDate: establishmentAgg.establishment.nextAvailabilityDate,
  };
};
