import { ImmersionContactInEstablishmentId } from "../../../shared/FormEstablishmentDto";
import { ImmersionOfferId } from "../../../shared/SearchImmersionDto";
import { Position } from "../ports/GetPosition";

export type ContactEntityV2 = {
  id: ImmersionContactInEstablishmentId;
  lastName: string;
  firstName: string;
  email: string;
  job: string;
  phone: string;
};

export type ImmersionOfferEntityV2 = {
  id: ImmersionOfferId;
  rome: string;
  score: number;
};

export type ImmersionOfferProps = {
  id: ImmersionOfferId;
  rome: string;
  naf?: string;
  siret: string;
  name: string;
  voluntaryToImmersion: boolean;
  data_source: string;
  contactInEstablishment?: ImmersionEstablishmentContact;
  score: number;
  position: Position;
};

export type ImmersionEstablishmentContact = {
  id: ImmersionContactInEstablishmentId;
  name: string;
  firstname: string;
  email: string;
  role: string;
  siretEstablishment: string;
  phone: string;
};

export class ImmersionOfferEntity {
  constructor(private props: ImmersionOfferProps) {}

  public getProps() {
    return this.props;
  }

  public getId(): ImmersionOfferId {
    return this.props.id;
  }

  public getName() {
    return this.props.name;
  }

  public getRome() {
    return this.props.rome;
  }

  public toArrayOfProps() {
    let idContactInEstablishment = null;
    if (this.props.contactInEstablishment) {
      idContactInEstablishment = this.props.contactInEstablishment;
    }
    return [
      this.props.id,
      this.props.rome,
      this.extractCategory(),
      this.props.siret,
      this.props.naf,
      this.props.name,
      this.props.voluntaryToImmersion,
      this.props.data_source,
      idContactInEstablishment,
      this.props.score,
      this.props.position,
    ];
  }

  extractCategory(): number {
    if (this.props.naf) {
      return parseInt(this.props.naf.substring(0, 2));
    }
    return -1;
  }
}
