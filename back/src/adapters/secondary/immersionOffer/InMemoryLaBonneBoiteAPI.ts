import { SearchMade } from "../../../domain/immersionOffer/entities/SearchMadeEntity";
import { LaBonneBoiteAPI } from "../../../domain/immersionOffer/ports/LaBonneBoiteAPI";
import { LaBonneBoiteCompanyVO } from "../../../domain/immersionOffer/valueObjects/LaBonneBoiteCompanyVO";

export class InMemoryLaBonneBoiteAPI implements LaBonneBoiteAPI {
  constructor(private _results: LaBonneBoiteCompanyVO[] = []) {}

  public async searchCompanies(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    searchMade: SearchMade,
  ): Promise<LaBonneBoiteCompanyVO[]> {
    return this._results;
  }

  // for test purposes only
  public setNextResults(results: LaBonneBoiteCompanyVO[]) {
    this._results = results;
  }
}
