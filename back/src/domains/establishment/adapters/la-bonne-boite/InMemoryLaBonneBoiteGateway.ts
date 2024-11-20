import { RomeDto, SearchResultDto, SiretDto } from "shared";
import {
  LaBonneBoiteGateway,
  LaBonneBoiteRequestParams,
} from "../../ports/LaBonneBoiteGateway";
import { LaBonneBoiteCompanyDto } from "./LaBonneBoiteCompanyDto";

export class InMemoryLaBonneBoiteGateway implements LaBonneBoiteGateway {
  constructor(
    private _results: LaBonneBoiteCompanyDto[] = [],
    private _error: Error | null = null,
    public nbOfCalls = 0,
  ) {}

  public async searchCompanies({
    rome,
    romeLabel,
  }: LaBonneBoiteRequestParams): Promise<SearchResultDto[]> {
    this.nbOfCalls = this.nbOfCalls + 1;
    if (this._error) throw this._error;
    return this._results
      .filter((result) => result.isCompanyRelevant())
      .map((result) => result.toSearchResult({ romeCode: rome, romeLabel }));
  }

  public async fetchCompanyBySiret(
    siret: SiretDto,
    romeDto: RomeDto,
  ): Promise<SearchResultDto | null> {
    if (this._error) throw this._error;
    const result = this._results.find((result) => result.siret === siret);
    return result ? result.toSearchResult(romeDto) : null;
  }

  public setError(error: Error | null) {
    this._error = error;
  }

  // for test purposes only
  public setNextResults(results: LaBonneBoiteCompanyDto[]) {
    this._results = results;
  }
}
