import { ContactEntityV2 } from "../../../domain/immersionOffer/entities/ContactEntity";
import {
  AnnotatedEstablishmentEntityV2,
  employeeRangeByTefenCode,
  EstablishmentAggregate,
  EstablishmentEntityV2,
} from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import {
  AnnotatedImmersionOfferEntityV2,
  ImmersionOfferEntityV2,
} from "../../../domain/immersionOffer/entities/ImmersionOfferEntity";
import { SearchMade } from "../../../domain/immersionOffer/entities/SearchMadeEntity";
import { ImmersionOfferRepository } from "../../../domain/immersionOffer/ports/ImmersionOfferRepository";
import type { ImmersionOfferId } from "../../../shared/SearchImmersionDto";
import { SearchImmersionResultDto } from "../../../shared/SearchImmersionDto";
import { createLogger } from "../../../utils/logger";
import { distanceMetersBetweenCoordinates } from "./distanceBetweenCoordinates";

const logger = createLogger(__filename);

export const TEST_NAF_LABEL = "test_naf_label";
export const TEST_ROME_LABEL = "test_rome_label";
export const TEST_CITY = "test_city";
export const TEST_POSITION = { lat: 43.8666, lon: 8.3333 };

export class InMemoryImmersionOfferRepository
  implements ImmersionOfferRepository
{
  public constructor(
    private _establishmentAggregates: EstablishmentAggregate[] = [],
  ) {}

  async insertEstablishmentAggregates(aggregates: EstablishmentAggregate[]) {
    logger.info({ aggregates }, "insertEstablishmentAggregates");
    this._establishmentAggregates = [
      ...this._establishmentAggregates,
      ...aggregates,
    ];
  }

  async getAnnotatedEstablishmentByImmersionOfferId(
    immersionOfferId: ImmersionOfferId,
  ): Promise<AnnotatedEstablishmentEntityV2 | undefined> {
    logger.info(
      { immersionOfferId },
      "getAnnotatedEstablishmentByImmersionOfferId",
    );

    const establishment = this._establishmentAggregates.find((aggregate) =>
      aggregate.immersionOffers.some((offer) => offer.id === immersionOfferId),
    )?.establishment;

    if (establishment)
      return {
        ...establishment,
        nafLabel: TEST_NAF_LABEL,
        position: TEST_POSITION,
      };
  }

  async getContactByImmersionOfferId(
    immersionOfferId: ImmersionOfferId,
  ): Promise<ContactEntityV2 | undefined> {
    logger.info({ immersionOfferId }, "getContactByImmersionOfferId");
    const establishment =
      await this.getAnnotatedEstablishmentByImmersionOfferId(immersionOfferId);
    if (!establishment) return;
    const contacts = this._establishmentAggregates.find(
      (aggregate) => aggregate.establishment.siret == establishment?.siret,
    )?.contacts;
    return contacts && contacts[0];
  }

  async getAnnotatedImmersionOfferById(
    immersionOfferId: ImmersionOfferId,
  ): Promise<AnnotatedImmersionOfferEntityV2 | undefined> {
    logger.info({ immersionOfferId }, "getAnnotatedImmersionOfferById");
    const immersionOffer = this._establishmentAggregates
      .flatMap((aggregate) => aggregate.immersionOffers)
      .find((immersionOffer) => (immersionOffer.id = immersionOfferId));

    if (immersionOffer)
      return {
        ...immersionOffer,
        romeLabel: TEST_ROME_LABEL,
      };
  }

  public async getSearchImmersionResultDtoFromSearchMade(
    searchMade: SearchMade,
    withContactDetails = false,
  ): Promise<SearchImmersionResultDto[]> {
    logger.info({ searchMade, withContactDetails }, "getFromSearch");
    return this._establishmentAggregates.flatMap((aggregate) =>
      aggregate.immersionOffers
        .filter(
          (immersionOffer) =>
            !searchMade.rome || immersionOffer.rome === searchMade.rome,
        )
        .map((immersionOffer) =>
          buildSearchImmersionResultDto(
            immersionOffer,
            aggregate.establishment,
            aggregate.contacts[0],
            searchMade,
            withContactDetails,
          ),
        ),
    );
  }

  public async getActiveEstablishmentSiretsFromLaBonneBoiteNotUpdatedSince(
    since: Date,
  ): Promise<string[]> {
    return this._establishmentAggregates
      .filter(
        (aggregate) =>
          aggregate.establishment.isActive &&
          (aggregate.establishment.updatedAt
            ? aggregate.establishment.updatedAt <= since
            : true),
      )
      .map((aggregate) => aggregate.establishment.siret);
  }

  public async updateEstablishment(
    siret: string,
    propertiesToUpdate: Partial<
      Pick<
        EstablishmentEntityV2,
        "address" | "position" | "naf" | "numberEmployeesRange" | "isActive"
      >
    > & { updatedAt: Date },
  ): Promise<void> {
    this._establishmentAggregates = this._establishmentAggregates.map(
      (aggregate) =>
        aggregate.establishment.siret === siret
          ? {
              ...aggregate,
              establishment: {
                ...aggregate.establishment,
                address:
                  propertiesToUpdate.address || aggregate.establishment.address,
                position:
                  propertiesToUpdate.position ||
                  aggregate.establishment.position,
                naf: propertiesToUpdate.naf || aggregate.establishment.naf,
                numberEmployeesRange:
                  propertiesToUpdate.numberEmployeesRange ||
                  aggregate.establishment.numberEmployeesRange,
                isActive:
                  propertiesToUpdate.isActive !== undefined
                    ? propertiesToUpdate.isActive
                    : aggregate.establishment.isActive,
                updatedAt: propertiesToUpdate.updatedAt,
              },
            }
          : aggregate,
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

const buildSearchImmersionResultDto = (
  immersionOffer: ImmersionOfferEntityV2,
  establishment: EstablishmentEntityV2,
  contact: ContactEntityV2 | undefined,
  searchMade: SearchMade,
  withContactDetails: boolean,
): SearchImmersionResultDto => ({
  id: immersionOffer.id,
  address: establishment.address,
  naf: establishment.naf,
  nafLabel: TEST_NAF_LABEL,
  name: establishment.name,
  rome: immersionOffer.rome,
  romeLabel: TEST_ROME_LABEL,
  siret: establishment.siret,
  voluntaryToImmersion: establishment.voluntaryToImmersion,
  contactMode: establishment.contactMethod,
  numberOfEmployeeRange:
    employeeRangeByTefenCode[establishment.numberEmployeesRange],
  distance_m: distanceMetersBetweenCoordinates(
    TEST_POSITION.lat,
    TEST_POSITION.lon,
    searchMade.lat,
    searchMade.lon,
  ),
  location: TEST_POSITION,
  city: TEST_CITY,
  ...(withContactDetails &&
    contact && {
      contactDetails: {
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        role: contact.job,
      },
    }),
});
