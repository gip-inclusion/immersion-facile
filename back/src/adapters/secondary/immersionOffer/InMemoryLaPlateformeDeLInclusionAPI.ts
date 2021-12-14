import { SearchParams } from "../../../domain/immersionOffer/ports/ImmersionOfferRepository";
import {
  LaPlateformeDeLInclusionResult,
  LaPlateformeDeLInclusionAPI,
} from "../../../domain/immersionOffer/ports/LaPlateformeDeLInclusionAPI";

export class InMemoryLaPlateformeDeLInclusionAPI
  implements LaPlateformeDeLInclusionAPI
{
  constructor(private _results: LaPlateformeDeLInclusionResult[] = []) {}

  public async getResults(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _searchParams: SearchParams,
  ): Promise<LaPlateformeDeLInclusionResult[]> {
    return this._results;
  }

  // for test purposes only
  public setNextResults(results: LaPlateformeDeLInclusionResult[]) {
    this._results = results;
  }
}
