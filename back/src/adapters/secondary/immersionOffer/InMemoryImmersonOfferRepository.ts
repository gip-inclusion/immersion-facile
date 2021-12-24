import { ContactEntityV2 } from "../../../domain/immersionOffer/entities/ContactEntity";
import {
  AnnotatedEstablishmentEntityV2,
  EstablishmentAggregate,
  EstablishmentEntityV2,
} from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import {
  AnnotatedImmersionOfferEntityV2,
  ImmersionOfferEntityV2,
} from "../../../domain/immersionOffer/entities/ImmersionOfferEntity";
import { SearchParams } from "../../../domain/immersionOffer/entities/SearchParams";
import { ImmersionOfferRepository } from "../../../domain/immersionOffer/ports/ImmersionOfferRepository";
import type { ImmersionOfferId } from "../../../shared/SearchImmersionDto";
import { SearchImmersionResultDto } from "../../../shared/SearchImmersionDto";
import { createLogger } from "../../../utils/logger";

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

  public async getFromSearch(
    searchParams: SearchParams,
    withContactDetails = false,
  ): Promise<SearchImmersionResultDto[]> {
    logger.info({ searchParams, withContactDetails }, "getFromSearch");
    return this._establishmentAggregates
      .filter(
        (aggregate) =>
          !searchParams.nafDivision ||
          aggregate.establishment.naf.startsWith(searchParams.nafDivision),
      )
      .filter(
        (aggregate) =>
          !searchParams.siret ||
          aggregate.establishment.siret === searchParams.siret,
      )
      .flatMap((aggregate) =>
        aggregate.immersionOffers
          .filter((immersionOffer) => immersionOffer.rome === searchParams.rome)
          .map((immersionOffer) =>
            buildSearchImmersionResultDto(
              immersionOffer,
              aggregate.establishment,
              aggregate.contacts[0],
              searchParams,
              withContactDetails,
            ),
          ),
      );
  }

  // for test purposes only :
  get establishmentAggregates() {
    return Object.values(this._establishmentAggregates);
  }
}

const buildSearchImmersionResultDto = (
  immersionOffer: ImmersionOfferEntityV2,
  establishment: EstablishmentEntityV2,
  contact: ContactEntityV2 | undefined,
  searchParams: SearchParams,
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
  distance_m: distanceBetweenCoordinates(
    TEST_POSITION.lat,
    TEST_POSITION.lon,
    searchParams.lat,
    searchParams.lon,
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

// Takes two coordinates (in degrees) and returns distance in meters.
// Taken from https://www.movable-type.co.uk/scripts/latlong.html (MIT license)
const distanceBetweenCoordinates = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // in metres
};
