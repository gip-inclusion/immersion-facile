import { EstablishmentEntity } from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import {
  ImmersionOfferEntity,
  ImmersionEstablishmentContact,
} from "../../../domain/immersionOffer/entities/ImmersionOfferEntity";
import {
  ImmersionOfferRepository,
  SearchParams,
} from "../../../domain/immersionOffer/ports/ImmersionOfferRepository";
import { SearchImmersionResultDto } from "../../../shared/SearchImmersionDto";
import { createLogger } from "../../../utils/logger";
import { EstablishmentEntityBuilder } from "../../../_testBuilders/EstablishmentEntityBuilder";

const logger = createLogger(__filename);

const someSiret = "78000403200029";
const immersions = [
  new ImmersionOfferEntity({
    id: "13df03a5-a2a5-430a-b558-ed3e2f03512d",
    rome: "M1907",
    naf: "8539A",
    siret: someSiret,
    name: "Company inside repository",
    voluntaryToImmersion: false,
    data_source: "api_labonneboite",
    contactInEstablishment: undefined,
    score: 4.5,
    position: { lat: 35, lon: 50 },
  }),
];
const establishments = [
  new EstablishmentEntityBuilder()
    .withSiret(someSiret)
    .withAddress("55 rue de Faubourg Sante Honoré")
    .withContactMode("EMAIL")
    .build(),
];

export class InMemoryImmersionOfferRepository
  implements ImmersionOfferRepository
{
  private _searches: SearchParams[] = [];
  private _immersionOffers: ImmersionOfferEntity[] = immersions;
  private _establishments: EstablishmentEntity[] = establishments;
  private _establishmentContacts: ImmersionEstablishmentContact[] = [];

  public async insertSearch(searchParams: SearchParams) {
    logger.info(searchParams, "insertSearch");
    this._searches.push(searchParams);
    return;
  }

  empty() {
    this._searches = [];
    this._immersionOffers = [];
    this._establishments = [];
    this._establishmentContacts = [];
  }

  async insertEstablishmentContact(
    immersionEstablishmentContact: ImmersionEstablishmentContact,
  ) {
    this._establishmentContacts.push(immersionEstablishmentContact);
  }
  public async insertImmersions(immersions: ImmersionOfferEntity[]) {
    logger.info(immersions, "insertImmersions");
    this._immersionOffers.push(...immersions);
    return;
  }

  public async insertEstablishments(establishments: EstablishmentEntity[]) {
    logger.info(establishments, "insertEstablishments");
    this._establishments.push(...establishments);
    return;
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
    let offers = this._immersionOffers.filter(
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
    const establishment = this._establishments.find(
      (establishment) => establishment.getSiret() === offer.getProps().siret,
    );
    if (!establishment)
      throw new Error("No establishment matching offer siret");

    const {
      id,
      name,
      siret,
      voluntaryToImmersion,
      rome,
      position,
      contactInEstablishment,
    } = offer.getProps();

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
        position &&
        searchParams &&
        distanceBetweenCoordinates(
          searchParams.lat,
          searchParams.lon,
          position.lat,
          position.lon,
        ),
      location: position,
    };
  }

  async getImmersionFromUuid(uuid: string) {
    const offer = this._immersionOffers.filter(
      (x) => x.getProps().id == uuid,
    )[0];
    return offer && this.buildSearchResult(offer);
  }

  // for test purposes only :
  async getEstablishmentsFromSiret(siret: string) {
    return this._establishments.filter((x) => x.getSiret() == siret);
  }

  setSearches(searches: SearchParams[]) {
    this._searches = searches;
  }
  get searches() {
    return this._searches;
  }
  get immersionOffers() {
    return this._immersionOffers;
  }
  get establishment() {
    return this._establishments;
  }
  get establishmentContact() {
    return this._establishmentContacts;
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
