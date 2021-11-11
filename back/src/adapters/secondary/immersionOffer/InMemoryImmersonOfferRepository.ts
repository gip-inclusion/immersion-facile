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

export class InMemoryImmersionOfferRepository
  implements ImmersionOfferRepository
{
  private _searches: SearchParams[] = [];
  private _immersionOffers: ImmersionOfferEntity[] = [];
  private _establishments: EstablishmentEntity[] = [];
  private _establishmentContact: ImmersionEstablishmentContact[] = [];

  public async insertSearch(searchParams: SearchParams) {
    logger.info(searchParams, "insertSearch");
    this._searches.push(searchParams);
    return;
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

  async getEstablishmentFromSiret(siret: string) {
    return this._establishments.filter((x) => x.getSiret() == siret);
  }

  public async getFromSearch(
    searchParams: SearchParams,
  ): Promise<ImmersionOfferEntity[]> {
    const response = this._immersionOffers.filter(
      (immersionOffer) => immersionOffer.getRome() === searchParams.rome,
    );
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
}
