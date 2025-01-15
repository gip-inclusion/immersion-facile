import {
  FtAgenciesReferential,
  FtAgencyFromReferential,
} from "../../../establishment/ports/FtAgenciesReferential";

export class InMemoryFtAgenciesReferential implements FtAgenciesReferential {
  #peAgencies: FtAgencyFromReferential[] = [];

  public async getFtAgencies(): Promise<FtAgencyFromReferential[]> {
    return this.#peAgencies;
  }

  public setFtAgencies(peAgencies: FtAgencyFromReferential[]) {
    this.#peAgencies = peAgencies;
  }
}
