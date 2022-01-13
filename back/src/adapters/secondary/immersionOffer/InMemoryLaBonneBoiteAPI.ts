import {
  LaBonneBoiteAPI,
  LaBonneBoiteRequestParams,
} from "../../../domain/immersionOffer/ports/LaBonneBoiteAPI";
import { LaBonneBoiteCompanyVO } from "../../../domain/immersionOffer/valueObjects/LaBonneBoiteCompanyVO";

export class InMemoryLaBonneBoiteAPI implements LaBonneBoiteAPI {
  constructor(
    private _results: LaBonneBoiteCompanyVO[] = [],
    private _error: Error | null = null,
    public nbOfCalls: number = 0,
  ) {}

  public async searchCompanies(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    searchParams: LaBonneBoiteRequestParams,
  ): Promise<LaBonneBoiteCompanyVO[]> {
    this.nbOfCalls = this.nbOfCalls + 1;
    if (this._error) throw this._error;
    return this._results;
  }

  // for test purposes only
  public setNextResults(results: LaBonneBoiteCompanyVO[]) {
    this._results = results;
  }
  public setError(error: Error | null) {
    this._error = error;
  }
}
