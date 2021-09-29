import { Flavor } from "../../../shared/typeFlavors";

export type CompanyId = Flavor<string, "CompanyId">;

export type Position = {
  lat: number;
  lon: number;
};

export type MandatoryCompanyFields = {
  id: CompanyId;
  address: string;
  city: string;
  score: number;
  romes: string[];
  siret: string;
  dataSource:
    | "api_labonneboite"
    | "api_laplateformedelinclusion"
    | "form"
    | "api_sirene";
  name: string;
};

export type CompanyFieldsToRetrieve = {
  number_employees: number;
  position: Position;
  naf: string;
};

type CompanyProps = MandatoryCompanyFields & CompanyFieldsToRetrieve;

export class CompanyEntity {
  constructor(private props: CompanyProps) {}

  public getRomeCodesArray() {
    return this.props.romes;
  }

  public getName() {
    return this.props.name;
  }

  public getScore() {
    return this.props.score;
  }

  public getDataSource() {
    return this.props.dataSource;
  }

  public getAddress(): string {
    return this.props.address;
  }

  public getPosition() {
    return this.props.position;
  }

  public getSiret() {
    return this.props.siret;
  }

  public getNaf() {
    return this.props.naf;
  }
}
