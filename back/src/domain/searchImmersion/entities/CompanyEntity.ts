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

// Code Tefen : Tranche Effectif Entreprise
export type TefenCode =
  | 0
  | 1
  | 2
  | 3
  | 11
  | 12
  | 21
  | 22
  | 31
  | 32
  | 41
  | 42
  | 51
  | 52
  | 53;

export type CompanyFieldsToRetrieve = {
  numberEmployeesRange: TefenCode;
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
