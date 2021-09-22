import { Flavor } from "../../../shared/typeFlavors";

export type CompanyId = Flavor<string, "CompanyId">;

export class CompanyEntity {
  constructor(
    private id: CompanyId,
    private address: string,
    private city: string,
    private lat: number,
    private lon: number,
    private matched_rome_code: string,
    private naf: string,
    private name: string,
    private siret: string,
    private stars: number, //The ratin of the company. Set to -1 if unknown
  ) {}

  public getMatched_rome_code() {
    return this.matched_rome_code;
  }

  public getName() {
    return this.name;
  }

  public getSiret() {
    return this.siret;
  }

  public getNaf() {
    return this.naf;
  }
}
