import {
  ImmersionOfferRepository,
  SearchParams,
} from "../../../domain/searchImmersion/ports/ImmersionOfferRepository";
import { ImmersionOfferEntity } from "../../../domain/searchImmersion/entities/ImmersionOfferEntity";
import { EstablishmentEntity } from "../../../domain/searchImmersion/entities/EstablishmentEntity";

export class InMemoryImmersionOfferRepository
  implements ImmersionOfferRepository
{
  private _searches: SearchParams[] = [];
  private _immersionOffers: ImmersionOfferEntity[] = [];
  private _establishment: EstablishmentEntity[] = [];

  public async insertSearch(searchParams: SearchParams) {
    this._searches.push(searchParams);
    return;
  }

  public async insertImmersions(immersions: ImmersionOfferEntity[]) {
    this._immersionOffers.push(...immersions);
    return;
  }

  public async insertEstablishments(establishments: EstablishmentEntity[]) {
    this._establishment.push(...establishments);
    return;
  }

  public async markPendingResearchesAsProcessedAndRetrieveThem(): Promise<
    SearchParams[]
  > {
    const searchesToReturn = this._searches;
    this._searches = [];
    return searchesToReturn;
  }

  public async getFromSearch(
    searchParams: SearchParams,
  ): Promise<ImmersionOfferEntity[]> {
    return this._immersionOffers.filter(
      (immersionOffer) => immersionOffer.getRome() === searchParams.ROME,
    );
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
