import { Flavor } from "../../../shared/typeFlavors";
import {
  ContactMethod,
  BusinessContactDto,
} from "../../../shared/FormEstablishmentDto";
import {
  ImmersionOfferEntity,
  ImmersionEstablishmentContact,
} from "./ImmersionOfferEntity";
import { v4 as uuidV4 } from "uuid";

export type EstablishmentId = Flavor<string, "EstablishmentId">;

export type Position = {
  lat: number;
  lon: number;
};

export type MandatoryEstablishmentFields = {
  id: EstablishmentId;
  siret: string;
  name: string;
  address: string;
  score: number;
  romes: string[];
  voluntary_to_immersion: boolean;
  dataSource:
    | "api_labonneboite"
    | "api_laplateformedelinclusion"
    | "form"
    | "api_sirene";
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
  contact_in_establishment: ImmersionEstablishmentContact;
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
      this.props.position,
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

  public setContact_mode(contact_mode: ContactMethod) {
    this.props.contact_mode = contact_mode;
  }

  public setContact_in_establishment(
    contact_in_establishment: ImmersionEstablishmentContact,
  ) {
    this.props.contact_in_establishment = contact_in_establishment;
  }

  public extractImmersions(): ImmersionOfferEntity[] {
    const romeArray = this.getRomeCodesArray();
    return romeArray.map((rome) => {
      if (this.props.contact_in_establishment) {
        return new ImmersionOfferEntity({
          id: uuidV4(),
          rome: rome,
          naf: this.props.naf,
          siret: this.props.siret,
          name: this.props.name,
          voluntary_to_immersion: this.props.voluntary_to_immersion,
          data_source: this.getDataSource(),
          contact_in_establishment: this.props.contact_in_establishment,
          score: this.getScore(),
          position: this.getPosition(),
        });
      } else {
        return new ImmersionOfferEntity({
          id: uuidV4(),
          rome: rome,
          naf: this.props.naf,
          siret: this.props.siret,
          name: this.props.name,
          voluntary_to_immersion: this.props.voluntary_to_immersion,
          data_source: this.getDataSource(),
          score: this.getScore(),
          position: this.getPosition(),
        });
      }
    });
  }
}
