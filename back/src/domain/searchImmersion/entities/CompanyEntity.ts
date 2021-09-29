import { Flavor } from "../../../shared/typeFlavors";

export type CompanyId = Flavor<string, "CompanyId">;

export class CompanyEntity {
  constructor(
    private id: CompanyId,
    private address: string,
    private number_employees: number,
    private city: string,
    private lat: number,
    private lon: number,
    private naf: string,
    private name: string,
    private siret: string,
    private score: number,
    private romes: string[],
    private dataSource: string,
  ) {}

  public getRomeCodesArray() {
    return this.romes;
  }

  public getName() {
    return this.name;
  }

  public getScore() {
    return this.score;
  }

  public getDataSource() {
    return this.dataSource;
  }

  public getAddress(): string {
    return this.address;
  }

  public getLongitude() {
    return this.lon;
  }

  public setLatitude(lat: number) {
    this.lat = lat;
  }

  public setLongitude(lon: number) {
    this.lon = lon;
  }

  public getSiret() {
    return this.siret;
  }

  public getNaf() {
    return this.naf;
  }
}
