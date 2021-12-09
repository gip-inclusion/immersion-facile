import { EstablishmentEntity } from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import {
  ImmersionEstablishmentContact,
  ImmersionOfferEntity
} from "../../../domain/immersionOffer/entities/ImmersionOfferEntity";
import {
  ImmersionOfferRepository,
  SearchParams
} from "../../../domain/immersionOffer/ports/ImmersionOfferRepository";
import {
  ImmersionOfferId,
  SearchImmersionResultDto
} from "../../../shared/SearchImmersionDto";
import { createLogger } from "../../../utils/logger";
import { EstablishmentEntityBuilder } from "../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionEstablishmentContactBuilder } from "../../../_testBuilders/ImmersionEstablishmentContactBuilder";
import { ImmersionOfferEntityBuilder } from "../../../_testBuilders/ImmersionOfferEntityBuilder";

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

export class InMemoryImmersionOfferRepository
  implements ImmersionOfferRepository
{
  public constructor(
    private _searches: SearchParams[] = [],
    private _immersionOffers: {
      [id: string]: ImmersionOfferEntity;
    } = {},
    private _establishments: { [siret: string]: EstablishmentEntity } = {},
    private _establishmentContacts: {
      [siret: string]: ImmersionEstablishmentContact;
    } = {},
  ) {
    this._establishments[establishment.getSiret()] = establishment;
    this._establishmentContacts[establishmentContact.siretEstablishment] =
      establishmentContact;
    this._immersionOffers[immersionOffer.getId()] = immersionOffer;
  }

  public async insertSearch(searchParams: SearchParams) {
    logger.info(searchParams, "insertSearch");
    this._searches.push(searchParams);
    return;
  }

  empty() {
    this._searches = [];
    this._immersionOffers = {};
    this._establishments = {};
    this._establishmentContacts = {};
    return this;
  }

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

  public async markPendingResearchesAsProcessedAndRetrieveThem(): Promise<
    SearchParams[]
  > {
    logger.info("markPendingResearchesAsProcessedAndRetrieveThem");
    const searchesToReturn = this._searches;
    this._searches = [];
    return searchesToReturn;
  }

  public async getFromSearch(
    searchParams: SearchParams,
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
      return this.buildSearchResult(offer, searchParams);
    });
  }

  private buildSearchResult(
    offer: ImmersionOfferEntity,
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
      contactId: contactInEstablishment?.id,
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
    };
  }

  async getImmersionFromUuid(uuid: ImmersionOfferId) {
    const offer = this._immersionOffers[uuid];
    return offer && this.buildSearchResult(offer);
  }

  // for test purposes only :
  async getEstablishmentFromSiret(siret: string) {
    return this._establishments[siret];
  }

  setSearches(searches: SearchParams[]) {
    this._searches = searches;
  }
  get searches() {
    return this._searches;
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
