import { uniqBy } from "ramda";
import {
  AppellationAndRomeDto,
  AppellationCode,
  conflictErrorSiret,
  GeoPositionDto,
  path,
  pathEq,
  pathNotEq,
  replaceArrayElement,
  SearchImmersionResultDto,
  SiretDto,
} from "shared";
import {
  EstablishmentAggregate,
  EstablishmentEntity,
} from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import {
  EstablishmentAggregateRepository,
  SearchImmersionParams,
  SearchImmersionResult,
  UpdateEstablishmentsWithInseeDataParams,
} from "../../../domain/immersionOffer/ports/EstablishmentAggregateRepository";
import { distanceBetweenCoordinatesInMeters } from "../../../utils/distanceBetweenCoordinatesInMeters";
import { ConflictError, NotFoundError } from "../../primary/helpers/httpErrors";

export const TEST_NAF_LABEL = "test_naf_label";
export const TEST_ROME_LABEL = "test_rome_label";
export const TEST_APPELLATION_LABEL = "test_appellation_label";
export const TEST_APPELLATION_CODE = "12345";
export const TEST_POSITION = { lat: 43.8666, lon: 8.3333 };

export class InMemoryEstablishmentAggregateRepository
  implements EstablishmentAggregateRepository
{
  constructor(
    private _establishmentAggregates: EstablishmentAggregate[] = [],
  ) {}

  public getSiretOfEstablishmentsToSuggestUpdate(): Promise<SiretDto[]> {
    throw new Error(
      "Method not implemented : getSiretOfEstablishmentsToSuggestUpdate, you can use PG implementation instead",
    );
  }

  public async markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerWeek(): Promise<number> {
    // not implemented because this method is used only in a script,
    // and the use case consists only in a PG query
    throw new Error("NOT implemented");
  }

  public async insertEstablishmentAggregates(
    aggregates: EstablishmentAggregate[],
  ) {
    this._establishmentAggregates = [
      ...this._establishmentAggregates,
      ...aggregates,
    ];
  }

  public async updateEstablishmentAggregate(aggregate: EstablishmentAggregate) {
    const aggregateIndex = this._establishmentAggregates.findIndex(
      pathEq("establishment.siret", aggregate.establishment.siret),
    );
    if (aggregateIndex === -1)
      throw new NotFoundError(
        `We do not have an establishment with siret ${aggregate.establishment.siret} to update`,
      );
    this._establishmentAggregates = replaceArrayElement(
      this._establishmentAggregates,
      aggregateIndex,
      aggregate,
    );
  }

  public async getEstablishmentAggregateBySiret(
    siret: SiretDto,
  ): Promise<EstablishmentAggregate | undefined> {
    return this._establishmentAggregates.find(
      pathEq("establishment.siret", siret),
    );
  }

  public async searchImmersionResults({
    searchMade: { lat, lon, appellationCode },
    maxResults,
  }: SearchImmersionParams): Promise<SearchImmersionResult[]> {
    return this._establishmentAggregates
      .filter((aggregate) => aggregate.establishment.isOpen)
      .flatMap((aggregate) =>
        uniqBy((offer) => offer.romeCode, aggregate.immersionOffers)
          .filter(
            (offer) =>
              !appellationCode || appellationCode === offer.appellationCode,
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

  // to delete when api v0 and v1 are removed
  public async getSearchImmersionResultDtoBySiretAndRome(
    siret: SiretDto,
    rome: string,
  ): Promise<SearchImmersionResultDto | undefined> {
    const aggregate = this.establishmentAggregates.find(
      (aggregate) => aggregate.establishment.siret === siret,
    );
    if (!aggregate) return undefined;

    const searchedAppellationCode =
      aggregate.immersionOffers.find(({ romeCode }) => romeCode === rome)
        ?.appellationCode ?? "no-appellation-code-matched";

    const {
      isSearchable,
      ...buildSearchImmersionResultWithoutContactDetailsAndIsSearchable
    } = buildSearchImmersionResultDtoForOneEstablishmentAndOneRome({
      establishmentAgg: aggregate,
      searchedAppellationCode,
    });
    return buildSearchImmersionResultWithoutContactDetailsAndIsSearchable;
  }

  public async updateEstablishment(
    propertiesToUpdate: Partial<EstablishmentEntity> & {
      updatedAt: Date;
      siret: SiretDto;
    },
  ): Promise<void> {
    this._establishmentAggregates = this._establishmentAggregates.map(
      (aggregate) =>
        aggregate.establishment.siret === propertiesToUpdate.siret
          ? {
              ...aggregate,
              establishment: {
                ...aggregate.establishment,
                ...JSON.parse(JSON.stringify(propertiesToUpdate)), // parse and stringify to drop undefined values from propertiesToUpdate (Does not work with clone() from ramda)
                updatedAt: propertiesToUpdate.updatedAt,
              },
            }
          : aggregate,
    );
  }

  public async hasEstablishmentWithSiret(siret: string): Promise<boolean> {
    if (siret === conflictErrorSiret)
      throw new ConflictError(
        `Establishment with siret ${siret} already in db`,
      );
    return !!this._establishmentAggregates.find(
      (aggregate) => aggregate.establishment.siret === siret,
    );
  }

  public async removeEstablishmentAndOffersAndContactWithSiret(
    siret: string,
  ): Promise<void> {
    this.establishmentAggregates = this._establishmentAggregates.filter(
      pathNotEq("establishment.siret", siret),
    );
  }

  public async getOffersAsAppellationDtoEstablishment(
    siret: string,
  ): Promise<AppellationAndRomeDto[]> {
    return (
      this.establishmentAggregates
        .find(pathEq("establishment.siret", siret))
        ?.immersionOffers.map((offer) => ({
          romeCode: offer.romeCode,
          appellationCode: offer.appellationCode?.toString() ?? "", // Should not be undefined though
          romeLabel: TEST_ROME_LABEL,
          appellationLabel: TEST_APPELLATION_LABEL,
        })) ?? []
    );
  }

  public async getSearchImmersionResultDtoBySiretAndAppellationCode(
    siret: SiretDto,
    appellationCode: AppellationCode,
  ): Promise<SearchImmersionResultDto | undefined> {
    const aggregate = this.establishmentAggregates.find(
      (aggregate) => aggregate.establishment.siret === siret,
    );
    if (!aggregate) return;
    const immersionOffer = aggregate.immersionOffers.find(
      (offer) => offer.appellationCode === appellationCode,
    );
    if (!immersionOffer) return;
    const { isSearchable, ...rest } =
      buildSearchImmersionResultDtoForOneEstablishmentAndOneRome({
        establishmentAgg: aggregate,
        searchedAppellationCode: immersionOffer.appellationCode,
      });
    return rest;
  }

  async getSiretsOfEstablishmentsWithRomeCode(
    rome: string,
  ): Promise<SiretDto[]> {
    return this._establishmentAggregates
      .filter(
        (aggregate) =>
          !!aggregate.immersionOffers.find((offer) => offer.romeCode === rome),
      )
      .map(path("establishment.siret"));
  }

  public async getSiretsOfEstablishmentsNotCheckedAtInseeSince(
    checkDate: Date,
    maxResults: number,
  ): Promise<SiretDto[]> {
    return this._establishmentAggregates
      .filter(
        (establishmentAggregate) =>
          !establishmentAggregate.establishment.lastInseeCheckDate ||
          establishmentAggregate.establishment.lastInseeCheckDate < checkDate,
      )
      .map(({ establishment }) => establishment.siret)
      .slice(0, maxResults);
  }

  public async updateEstablishmentsWithInseeData(
    inseeCheckDate: Date,
    params: UpdateEstablishmentsWithInseeDataParams,
  ): Promise<void> {
    this._establishmentAggregates = this._establishmentAggregates.map(
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

  // for test purposes only :
  get establishmentAggregates() {
    return this._establishmentAggregates;
  }

  set establishmentAggregates(
    establishmentAggregates: EstablishmentAggregate[],
  ) {
    this._establishmentAggregates = establishmentAggregates;
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
    establishmentAgg.immersionOffers.find(
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
    appellations: establishmentAgg.immersionOffers
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
  };
};
