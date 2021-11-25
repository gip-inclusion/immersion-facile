import { v4 as uuidV4 } from "uuid";
import { ContactMethod } from "../../../shared/FormEstablishmentDto";
import { Flavor } from "../../../shared/typeFlavors";
import {
  ImmersionEstablishmentContact,
  ImmersionOfferEntity,
} from "./ImmersionOfferEntity";

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
  voluntaryToImmersion: boolean;
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
  | 53
  | -1;

export type EstablishmentFieldsToRetrieve = {
  numberEmployeesRange: TefenCode;
  position: Position;
  naf: string;
};

export type OptionalEstablishmentFields = {
  contactMode: ContactMethod;
  contactInEstablishment: ImmersionEstablishmentContact;
};

type EstablishmentProps = MandatoryEstablishmentFields &
  EstablishmentFieldsToRetrieve &
  Partial<OptionalEstablishmentFields>;

export class EstablishmentEntity {
  toArrayOfProps(): any[] {
    return [
      this.props.siret,
      this.props.name,
      this.props.address,
      this.props.numberEmployeesRange,
      this.props.naf,
      this.props.contactMode,
      this.props.dataSource,
      this.props.position,
      this.props.contactMode,
      this.props.contactInEstablishment,
    ];
  }
  constructor(private props: EstablishmentProps) {}

  public getRomeCodesArray() {
    return this.props.romes;
  }

  public getContact() {
    return this.props.contactInEstablishment;
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

  public setContactMode(contactMode: ContactMethod) {
    this.props.contactMode = contactMode;
  }

  public setContactInEstablishment(
    immersionEstablishmentContact: ImmersionEstablishmentContact,
  ) {
    this.props.contactInEstablishment = immersionEstablishmentContact;
  }

  public extractImmersions(): ImmersionOfferEntity[] {
    const romeArray = this.getRomeCodesArray();

    return romeArray.map(
      (rome) =>
        new ImmersionOfferEntity({
          id: uuidV4(),
          rome: rome,
          naf: this.props.naf,
          siret: this.props.siret,
          name: this.props.name,
          voluntaryToImmersion: this.props.voluntaryToImmersion,
          data_source: this.getDataSource(),
          contactInEstablishment: this.props.contactInEstablishment,
          score: this.getScore(),
          position: this.getPosition(),
          address: this.props.address,
        }),
    );
  }
}
