import { EstablishmentEntity } from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import {
  ImmersionOfferEntity,
  ImmersionEstablishmentContact,
} from "../../../domain/immersionOffer/entities/ImmersionOfferEntity";
import {
  ImmersionOfferRepository,
  SearchParams,
} from "../../../domain/immersionOffer/ports/ImmersionOfferRepository";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

const immersions = [
  new ImmersionOfferEntity({
    id: "13df03a5-a2a5-430a-b558-ed3e2f03512d",
    rome: "M1907",
    naf: "8539A",
    siret: "78000403200029",
    name: "Company inside repository",
    voluntaryToImmersion: false,
    data_source: "api_labonneboite",
    contactInEstablishment: undefined,
    score: 4.5,
    position: { lat: 35, lon: 50 },
    address: "55 rue de Faubourg Sante Honoré",
  }),
];

export class InMemoryImmersionOfferRepository
  implements ImmersionOfferRepository
{
  private _searches: SearchParams[] = [];
  private _immersionOffers: ImmersionOfferEntity[] = immersions;
  private _establishments: EstablishmentEntity[] = [];
  private _establishmentContact: ImmersionEstablishmentContact[] = [];

  public async insertSearch(searchParams: SearchParams) {
    logger.info(searchParams, "insertSearch");
    this._searches.push(searchParams);
    return;
  }

  empty() {
    this._searches = [];
    this._immersionOffers = [];
    this._establishments = [];
    this._establishmentContact = [];
  }

  async insertEstablishmentContact(
    immersionEstablishmentContact: ImmersionEstablishmentContact,
  ) {
    this._establishmentContact.push(immersionEstablishmentContact);
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
  ): Promise<ImmersionOfferEntity[]> {
    let response = this._immersionOffers.filter(
      (immersionOffer) => immersionOffer.getRome() === searchParams.rome,
    );
    if (searchParams.nafDivision) {
      response = response.filter(
        (immersionOffer) =>
          immersionOffer.extractCategory() + "" === searchParams.nafDivision,
      );
    }
    if (searchParams.siret) {
      response = response.filter(
        (immersionOffer) =>
          immersionOffer.getProps().siret + "" === searchParams.siret,
      );
    }
    logger.info({ searchParams, response }, "getFromSearch");
    return response;
  }

  // for test purposes only :
  setSearches(searches: SearchParams[]) {
    this._searches = searches;
  }

  getSearches() {
    return this._searches;
  }

  getImmersionOffers(): ImmersionOfferEntity[] {
    return this._immersionOffers;
  }

  async getEstablishmentsFromSiret(siret: string) {
    return this._establishments.filter((x) => x.getSiret() == siret);
  }

  async getImmersionFromUuid(uuid: string) {
    return this._immersionOffers.filter((x) => x.getProps().id == uuid)[0];
  }
}
