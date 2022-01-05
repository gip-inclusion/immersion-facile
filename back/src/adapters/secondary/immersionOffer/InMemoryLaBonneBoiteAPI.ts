import { SearchParams } from "../../../domain/immersionOffer/entities/SearchParams";
import { LaBonneBoiteAPI } from "../../../domain/immersionOffer/ports/LaBonneBoiteAPI";
import { LaBonneBoiteCompanyVO } from "../../../domain/immersionOffer/valueObjects/LaBonneBoiteCompanyVO";

export class InMemoryLaBonneBoiteAPI implements LaBonneBoiteAPI {
  constructor(private _results: LaBonneBoiteCompanyVO[] = []) {}

  public async searchCompanies(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _searchParams: SearchParams,
  ): Promise<LaBonneBoiteCompanyVO[]> {
    return this._results;
  }

  // for test purposes only
  public setNextResults(results: LaBonneBoiteCompanyVO[]) {
    this._results = results;
  }
}
