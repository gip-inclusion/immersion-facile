import { ImmersionContactInEstablishmentId } from "../../../shared/FormEstablishmentDto";
import { ImmersionOfferId } from "../../../shared/SearchImmersionDto";
import { Position } from "./EstablishmentEntity";

export type ImmersionOfferProps = {
  id: ImmersionOfferId;
  rome: string;
  naf?: string;
  siret: string;
  name: string;
  voluntary_to_immersion: boolean;
  data_source: string;
  contact_in_establishment?: ImmersionEstablishmentContact;
  score: number;
  position?: Position;
};

export type ImmersionEstablishmentContact = {
  id: ImmersionContactInEstablishmentId;
  name: string;
  firstname: string;
  email: string;
  role: string;
  siretEstablishment: string;
};

export class ImmersionOfferEntity {
  constructor(private props: ImmersionOfferProps) {}

  public getProps() {
    return this.props;
  }

  public getName() {
    return this.props.name;
  }

  public getRome() {
    return this.props.rome;
  }

  public toArrayOfProps() {
    let idContactInEstablishment = null;
    if (this.props.contact_in_establishment) {
      idContactInEstablishment = this.props.contact_in_establishment;
    }
    return [
      this.props.id,
      this.props.rome,
      this.extractCategory(),
      this.props.siret,
      this.props.naf,
      this.props.name,
      this.props.voluntary_to_immersion,
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
