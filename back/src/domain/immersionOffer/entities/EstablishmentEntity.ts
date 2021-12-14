import { v4 as uuidV4 } from "uuid";
import { ContactMethod } from "../../../shared/FormEstablishmentDto";
import { Flavor } from "../../../shared/typeFlavors";
import { Position } from "../ports/AdresseAPI";
import { TefenCode } from "./EstablishmentAggregate";
import {
  ImmersionEstablishmentContact,
  ImmersionOfferEntity,
} from "./ImmersionOfferEntity";

export type EstablishmentId = Flavor<string, "EstablishmentId">;

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

export type EstablishmentFieldsToRetrieve = {
  numberEmployeesRange: TefenCode;
  position: Position;
  naf: string;
};

export type OptionalEstablishmentFields = {
  contactMode: ContactMethod;
  contactInEstablishment: ImmersionEstablishmentContact;
};

export type EstablishmentProps = MandatoryEstablishmentFields &
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
      this.props.contactInEstablishment,
    ];
  }
  constructor(private props: EstablishmentProps) {}

  public getProps() {
    return this.props;
  }

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

  public getContactMode() {
    return this.props.contactMode;
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
          rome,
          naf: this.props.naf,
          siret: this.props.siret,
          name: this.props.name,
          voluntaryToImmersion: this.props.voluntaryToImmersion,
          data_source: this.getDataSource(),
          contactInEstablishment: this.props.contactInEstablishment,
          score: this.getScore(),
          position: this.getPosition(),
        }),
    );
  }
}
