import { Flavor } from "../../../shared/typeFlavors";
import {
  ContactMethod,
  BusinessContactDto,
} from "../../../shared/ImmersionOfferDto";

export type EstablishmentId = Flavor<string, "EstablishmentId">;

export type Position = {
  lat: number;
  lon: number;
};

export type MandatoryEstablishmentFields = {
  id: EstablishmentId;
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

export type EstablishmentFieldsToRetrieve = {
  numberEmployeesRange: TefenCode;
  position: Position;
  naf: string;
};

export type OptionalEstablishmentFields = {
  contact_mode: ContactMethod;
  contact_in_establishment: BusinessContactDto;
};

type EstablishmentProps = MandatoryEstablishmentFields &
  EstablishmentFieldsToRetrieve &
  Partial<OptionalEstablishmentFields>;

export class EstablishmentEntity {
  toArrayOfProps(): any {
    return [
      this.props.siret,
      this.props.name,
      this.props.address,
      this.props.numberEmployeesRange,
      this.props.naf,
      this.props.contact_mode,
      this.props.dataSource,
    ];
  }
  constructor(private props: EstablishmentProps) {}

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
