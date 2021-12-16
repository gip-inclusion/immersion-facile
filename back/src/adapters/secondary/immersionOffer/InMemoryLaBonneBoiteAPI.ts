import { SearchParams } from "../../../domain/immersionOffer/entities/SearchParams";
import {
  LaBonneBoiteAPI,
  LaBonneBoiteCompany,
} from "../../../domain/immersionOffer/ports/LaBonneBoiteAPI";

export class InMemoryLaBonneBoiteAPI implements LaBonneBoiteAPI {
  constructor(private _results: LaBonneBoiteCompany[] = []) {}

  public async searchCompanies(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _searchParams: SearchParams,
  ): Promise<LaBonneBoiteCompany[]> {
    return this._results;
  }

  // for test purposes only
  public setNextResults(results: LaBonneBoiteCompany[]) {
    this._results = results;
  }
}
