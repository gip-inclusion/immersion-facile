import {
  AppellationAndRomeDto,
  AppellationCode,
  conflictErrorSiret,
  path,
  pathEq,
  pathNotEq,
  propEq,
  replaceArrayElement,
  SearchImmersionResultDto,
  SiretDto,
} from "shared";
import { ContactEntity } from "../../../domain/immersionOffer/entities/ContactEntity";
import {
  EstablishmentAggregate,
  EstablishmentEntity,
} from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import { ImmersionOfferEntityV2 } from "../../../domain/immersionOffer/entities/ImmersionOfferEntity";
import { SearchMade } from "../../../domain/immersionOffer/entities/SearchMadeEntity";
import {
  EstablishmentAggregateRepository,
  OfferWithSiret,
  UpdateEstablishmentsWithInseeDataParams,
} from "../../../domain/immersionOffer/ports/EstablishmentAggregateRepository";
import { distanceBetweenCoordinatesInMeters } from "../../../utils/distanceBetweenCoordinatesInMeters";
import { createLogger } from "../../../utils/logger";
import { ConflictError, NotFoundError } from "../../primary/helpers/httpErrors";

const logger = createLogger(__filename);

export const TEST_NAF_LABEL = "test_naf_label";
export const TEST_ROME_LABEL = "test_rome_label";
export const TEST_APPELLATION_LABEL = "test_appellation_label";
export const TEST_APPELLATION_CODE = "12345";
export const TEST_POSITION = { lat: 43.8666, lon: 8.3333 };

export class InMemoryEstablishmentAggregateRepository
  implements EstablishmentAggregateRepository
{
  public constructor(
    private _establishmentAggregates: EstablishmentAggregate[] = [],
  ) {}

  getSiretOfEstablishmentsToSuggestUpdate(): Promise<SiretDto[]> {
    throw new Error(
      "Method not implemented : getSiretOfEstablishmentsToSuggestUpdate, you can use PG implementation instead",
    );
  }
  async markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerWeek(): Promise<number> {
    // not implemented because this method is used only in a script,
    // and the use case consists only in a PG query
    throw new Error("NOT implemented");
  }

  async insertEstablishmentAggregates(aggregates: EstablishmentAggregate[]) {
    logger.info({ aggregates }, "insertEstablishmentAggregates");
    this._establishmentAggregates = [
      ...this._establishmentAggregates,
      ...aggregates,
    ];
  }
  async updateEstablishmentAggregate(aggregate: EstablishmentAggregate) {
    logger.info({ aggregate }, "updateEstablishmentAggregate");
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
  async createImmersionOffersToEstablishments(
    offersWithSirets: OfferWithSiret[],
  ) {
    logger.info({ offersWithSirets }, "addImmersionOffersToEstablishments");

    this._establishmentAggregates = this._establishmentAggregates.map(
      (existingAggregate) => {
        const matchOfferToAddWithSiret = offersWithSirets.find(
          propEq("siret", existingAggregate.establishment.siret),
        );
        if (!matchOfferToAddWithSiret) return existingAggregate;
        const { siret, ...offerToAdd } = matchOfferToAddWithSiret;
        return {
          ...existingAggregate,
          immersionOffers: [...existingAggregate.immersionOffers, offerToAdd],
        };
      },
    );
  }

  async getEstablishmentAggregateBySiret(
    siret: SiretDto,
  ): Promise<EstablishmentAggregate | undefined> {
    return this._establishmentAggregates.find(
      pathEq("establishment.siret", siret),
    );
  }
  public async getSearchImmersionResultDtoFromSearchMade({
    searchMade,
    withContactDetails = false,
    maxResults,
  }: {
    searchMade: SearchMade;
    withContactDetails?: boolean;
    maxResults?: number;
  }): Promise<SearchImmersionResultDto[]> {
    logger.info({ searchMade, withContactDetails }, "getFromSearch");
    return this._establishmentAggregates
      .filter((aggregate) =>
        searchMade.voluntaryToImmersion === undefined
          ? true
          : aggregate.establishment.voluntaryToImmersion ==
            searchMade.voluntaryToImmersion,
      )
      .flatMap((aggregate) =>
        aggregate.immersionOffers
          .filter(
            (immersionOffer) =>
              !searchMade.rome || immersionOffer.romeCode === searchMade.rome,
          )
          .map((immersionOffer) =>
            buildSearchImmersionResultDto(
              immersionOffer,
              aggregate.establishment,
              aggregate.contact,
              searchMade,
              withContactDetails,
            ),
          ),
      )

      .slice(0, maxResults);
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
  public async getSearchImmersionResultDtoBySiretAndRome(
    siret: SiretDto,
    rome: string,
  ): Promise<SearchImmersionResultDto | undefined> {
    const aggregate = this.establishmentAggregates.find(
      (aggregate) => aggregate.establishment.siret === siret,
    );
    if (!aggregate) return;
    return {
      rome,
      romeLabel: TEST_ROME_LABEL,
      appellations: aggregate.immersionOffers
        .filter(propEq("romeCode", rome))
        .map((offer) => ({
          appellationLabel: offer.appellationLabel,
          appellationCode: offer.appellationCode,
        })),
      naf: aggregate.establishment.nafDto.code,
      nafLabel: TEST_NAF_LABEL,
      siret,
      name: aggregate?.establishment.name,
      customizedName: aggregate?.establishment.customizedName,
      voluntaryToImmersion: aggregate?.establishment.voluntaryToImmersion,
      numberOfEmployeeRange: aggregate.establishment.numberEmployeesRange,
      position: aggregate?.establishment.position,
      address: aggregate.establishment.address,
      contactMode: aggregate.contact?.contactMethod,
    };
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
    return {
      rome: immersionOffer.romeCode,
      romeLabel: TEST_ROME_LABEL,
      appellations: [
        {
          appellationCode: immersionOffer.appellationCode,
          appellationLabel: immersionOffer.appellationLabel,
        },
      ],
      naf: aggregate.establishment.nafDto.code,
      nafLabel: TEST_NAF_LABEL,
      siret,
      name: aggregate?.establishment.name,
      customizedName: aggregate?.establishment.customizedName,
      voluntaryToImmersion: aggregate?.establishment.voluntaryToImmersion,
      numberOfEmployeeRange: aggregate.establishment.numberEmployeesRange,
      position: aggregate?.establishment.position,
      address: aggregate.establishment.address,
      contactMode: aggregate.contact?.contactMethod,
    };
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

  // for test purposes only :
  get establishmentAggregates() {
    return this._establishmentAggregates;
  }
  set establishmentAggregates(
    establishmentAggregates: EstablishmentAggregate[],
  ) {
    this._establishmentAggregates = establishmentAggregates;
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

        if (newValues)
          return {
            ...aggregate,
            establishment: {
              ...aggregate.establishment,
              ...newValues,
              lastInseeCheckDate: inseeCheckDate,
            },
          };

        return aggregate;
      },
    );
  }
}

const buildSearchImmersionResultDto = (
  immersionOffer: ImmersionOfferEntityV2,
  establishment: EstablishmentEntity,
  contact: ContactEntity | undefined,
  searchMade: SearchMade,
  withContactDetails: boolean,
): SearchImmersionResultDto => ({
  address: establishment.address,
  naf: establishment.nafDto.code,
  nafLabel: TEST_NAF_LABEL,
  name: establishment.name,
  customizedName: establishment.customizedName,
  rome: immersionOffer.romeCode,
  romeLabel: TEST_ROME_LABEL,
  appellations: [
    {
      appellationLabel: immersionOffer.appellationLabel,
      appellationCode: immersionOffer.appellationCode,
    },
  ],
  siret: establishment.siret,
  voluntaryToImmersion: establishment.voluntaryToImmersion,
  contactMode: contact?.contactMethod,
  numberOfEmployeeRange: establishment.numberEmployeesRange,
  website: establishment?.website,
  additionalInformation: establishment?.additionalInformation,
  distance_m: distanceBetweenCoordinatesInMeters(
    TEST_POSITION.lat,
    TEST_POSITION.lon,
    searchMade.lat,
    searchMade.lon,
  ),
  position: TEST_POSITION,
  ...(withContactDetails &&
    contact && {
      contactDetails: {
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        job: contact.job,
      },
    }),
});
