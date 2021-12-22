import {
  EstablishmentAggregate,
  EstablishmentEntityV2,
} from "../../../domain/immersionOffer/entities/EstablishmentAggregate";
import { EstablishmentEntity } from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import {
  ContactEntityV2,
  ImmersionEstablishmentContact,
  ImmersionOfferEntity,
  ImmersionOfferEntityV2,
} from "../../../domain/immersionOffer/entities/ImmersionOfferEntity";
import { SearchParams } from "../../../domain/immersionOffer/entities/SearchParams";
import { ImmersionOfferRepository } from "../../../domain/immersionOffer/ports/ImmersionOfferRepository";
import type { ImmersionOfferId } from "../../../shared/SearchImmersionDto";
import { SearchImmersionResultDto } from "../../../shared/SearchImmersionDto";
import { createLogger } from "../../../utils/logger";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityBuilder } from "../../../_testBuilders/EstablishmentEntityBuilder";
import { EstablishmentEntityV2Builder } from "../../../_testBuilders/EstablishmentEntityV2Builder";
import { ImmersionEstablishmentContactBuilder } from "../../../_testBuilders/ImmersionEstablishmentContactBuilder";
import { ImmersionOfferEntityBuilder } from "../../../_testBuilders/ImmersionOfferEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";

const logger = createLogger(__filename);

export const validImmersionOfferId = "13df03a5-a2a5-430a-b558-ed3e2f03512d";

const establishment = new EstablishmentEntityBuilder()
  .withAddress("55 rue de Faubourg Sante Honoré")
  .withContactMode("EMAIL")
  .build();
const establishmentContact = new ImmersionEstablishmentContactBuilder()
  .withSiret(establishment.getSiret())
  .build();
const immersionOffer = new ImmersionOfferEntityBuilder()
  .withId(validImmersionOfferId)
  .withSiret(establishment.getProps().siret)
  .build();

const establishmentAggregate = new EstablishmentAggregateBuilder()
  .withEstablishment(
    new EstablishmentEntityV2Builder()
      .withAddress("55 rue de Faubourg Sante Honoré")
      .withContactMode("EMAIL")
      .build(),
  )
  .withImmersionOffers([
    new ImmersionOfferEntityV2Builder().withId(validImmersionOfferId).build(),
  ])
  .build();

export class InMemoryImmersionOfferRepository
  implements ImmersionOfferRepository
{
  public constructor(
    private _immersionOffers: {
      [id: string]: ImmersionOfferEntity;
    } = {},
    // TODO : DO NOT ADD ENTITIES IN CONSTRUCTOR ! This can be really confusing ..
    private _establishments: { [siret: string]: EstablishmentEntity } = {},
    private _establishmentContacts: {
      [siret: string]: ImmersionEstablishmentContact;
    } = {},
    private _establishmentAggregates: EstablishmentAggregate[] = [
      establishmentAggregate,
    ],
  ) {
    this._establishments[establishment.getSiret()] = establishment;
    this._establishmentContacts[establishmentContact.siretEstablishment] =
      establishmentContact;
    this._immersionOffers[immersionOffer.getId()] = immersionOffer;
  }

  empty() {
    this._immersionOffers = {};
    this._establishments = {};
    this._establishmentContacts = {};
    this._establishmentAggregates = [];
    return this;
  }

  async insertEstablishmentAggregates(aggregates: EstablishmentAggregate[]) {
    logger.info({ aggregates }, "insertEstablishmentAggregates");
    this._establishmentAggregates = [
      ...this._establishmentAggregates,
      ...aggregates,
    ];
  }

  async getEstablishmentByImmersionOfferId(
    immersionOfferId: ImmersionOfferId,
  ): Promise<EstablishmentEntityV2 | undefined> {
    return this._establishmentAggregates.find((aggregate) =>
      aggregate.immersionOffers.some((offer) => offer.id === immersionOfferId),
    )?.establishment;
  }

  async getContactByImmersionOfferId(
    immersionOfferId: ImmersionOfferId,
  ): Promise<ContactEntityV2 | undefined> {
    const establishment = await this.getEstablishmentByImmersionOfferId(
      immersionOfferId,
    );
    if (!establishment) return;
    const contacts = this._establishmentAggregates.find(
      (aggregate) => aggregate.establishment.siret == establishment?.siret,
    )?.contacts;
    return contacts && contacts[0];
  }

  async getImmersionOfferById(
    immersionOfferId: ImmersionOfferId,
  ): Promise<ImmersionOfferEntityV2 | undefined> {
    return this._establishmentAggregates
      .flatMap((aggregate) => aggregate.immersionOffers)
      .find((immersionOffer) => (immersionOffer.id = immersionOfferId));
  }

  // DEPRECATED.
  async insertEstablishmentContact(
    immersionEstablishmentContact: ImmersionEstablishmentContact,
  ) {
    logger.info(immersionEstablishmentContact, "insertEstablishmentContact");
    this._establishmentContacts[
      immersionEstablishmentContact.siretEstablishment
    ] = immersionEstablishmentContact;
  }

  public async insertImmersions(immersions: ImmersionOfferEntity[]) {
    logger.info(immersions, "insertImmersions");
    immersions.forEach((immersion) => {
      this._immersionOffers[immersion.getId()] = immersion;

      const establishmentContact = immersion.getProps().contactInEstablishment;
      if (establishmentContact) {
        this.insertEstablishmentContact(establishmentContact);
      }
    });
  }

  public async insertEstablishments(establishments: EstablishmentEntity[]) {
    logger.info(establishments, "insertEstablishments");
    establishments.forEach(
      (establishment) =>
        (this._establishments[establishment.getSiret()] = establishment),
    );
  }

  public async getFromSearch(
    searchParams: SearchParams,
    withContactDetails = false,
  ): Promise<SearchImmersionResultDto[]> {
    let offers = Object.values(this._immersionOffers).filter(
      (immersionOffer) => immersionOffer.getRome() === searchParams.rome,
    );
    if (searchParams.nafDivision) {
      offers = offers.filter(
        (immersionOffer) =>
          immersionOffer.extractCategory() + "" === searchParams.nafDivision,
      );
    }
    if (searchParams.siret) {
      offers = offers.filter(
        (immersionOffer) =>
          immersionOffer.getProps().siret + "" === searchParams.siret,
      );
    }
    logger.info({ searchParams, response: offers }, "getFromSearch");
    return offers.map((offer): SearchImmersionResultDto => {
      return this.buildSearchResult(offer, withContactDetails, searchParams);
    });
  }

  private buildSearchResult(
    offer: ImmersionOfferEntity,
    withContactDetails: boolean,
    searchParams?: SearchParams,
  ): SearchImmersionResultDto {
    const establishment = this._establishments[offer.getProps().siret];
    if (!establishment)
      throw new Error("No establishment matching offer siret");
    const contactInEstablishment =
      this._establishmentContacts[offer.getProps().siret];

    const { id, name, siret, voluntaryToImmersion, rome, position } =
      offer.getProps();

    return {
      id,
      address: establishment.getAddress(),
      naf: establishment.getNaf(),
      name,
      rome,
      siret,
      voluntaryToImmersion,
      contactMode: establishment.getContactMode(),
      distance_m:
        searchParams &&
        distanceBetweenCoordinates(
          searchParams.lat,
          searchParams.lon,
          position.lat,
          position.lon,
        ),
      location: position,
      city: "xxxx",
      nafLabel: "xxxx",
      romeLabel: "xxxx",
      ...(withContactDetails &&
        contactInEstablishment && {
          contactDetails: {
            id: contactInEstablishment.id,
            firstName: contactInEstablishment.firstName,
            lastName: contactInEstablishment.lastName,
            email: contactInEstablishment.email,
            phone: contactInEstablishment.phone,
            role: contactInEstablishment.role,
          },
        }),
    };
  }

  async getImmersionFromUuid(uuid: string) {
    const offer = this._immersionOffers[uuid];
    return offer && this.buildSearchResult(offer, false);
  }

  // for test purposes only :
  async getEstablishmentFromSiret(siret: string) {
    return this._establishmentAggregates.find(
      (establishmentAggregate) =>
        establishmentAggregate.establishment.siret == siret,
    );
  }

  get immersionOffers() {
    return Object.values(this._immersionOffers);
  }
  get establishments() {
    return Object.values(this._establishments);
  }
  get establishmentContacts() {
    return Object.values(this._establishmentContacts);
  }
  get establishmentAggregates() {
    return Object.values(this._establishmentAggregates);
  }
}

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
