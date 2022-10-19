import {
  PeAgenciesReferential,
  PeAgencyFromReferenciel,
} from "../../../../domain/immersionOffer/ports/PeAgenciesReferential";

export class InMemoryPeAgenciesReferential implements PeAgenciesReferential {
  private _peAgencies: PeAgencyFromReferenciel[] = [];

  async getPeAgencies(): Promise<PeAgencyFromReferenciel[]> {
    return this._peAgencies;
  }

  setPeAgencies(peAgencies: PeAgencyFromReferenciel[]) {
    this._peAgencies = peAgencies;
  }

  get peAgencies(): PeAgencyFromReferenciel[] {
    return this._peAgencies;
  }
}
