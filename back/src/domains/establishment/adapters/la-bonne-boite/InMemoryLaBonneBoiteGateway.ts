import type { RomeDto, SearchResultDto, SiretDto } from "shared";
import type {
  LaBonneBoiteGateway,
  SearchCompaniesParams,
} from "../../ports/LaBonneBoiteGateway";
import type { LaBonneBoiteCompanyDto } from "./LaBonneBoiteCompanyDto";

export class InMemoryLaBonneBoiteGateway implements LaBonneBoiteGateway {
  constructor(
    private _results: LaBonneBoiteCompanyDto[] = [],
    private _error: Error | null = null,
    public nbOfCalls = 0,
  ) {}

  public async searchCompanies({
    romeCode,
    romeLabel,
    lon,
    lat,
    nafCodes,
  }: SearchCompaniesParams): Promise<SearchResultDto[]> {
    this.nbOfCalls = this.nbOfCalls + 1;
    return this._error
      ? []
      : this._results
          .filter((result) => result.isCompanyRelevant())
          .filter((result) =>
            romeCode ? result.props.rome === romeCode : true,
          )
          .filter((result) =>
            nafCodes?.length ? nafCodes.includes(result.props.naf) : true,
          )
          .map((result) =>
            result.toSearchResult(
              { romeCode, romeLabel },
              {
                lat,
                lon,
              },
            ),
          );
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
