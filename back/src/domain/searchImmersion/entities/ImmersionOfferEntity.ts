import { Flavor } from "../../../shared/typeFlavors";

export type ImmersionOfferId = Flavor<string, "ImmersionProposalId">;
export type ImmersionContactInCompanyId = Flavor<
  string,
  "ImmersionContactInCompanyId"
>;

export type ImmersionOfferProps = {
  id: ImmersionOfferId;
  rome: string;
  naf?: string;
  siret: string;
  name: string;
  voluntary_to_immersion: boolean;
  data_source: string;
  contact_in_company?: ImmersionCompanyContact;
  score: number;
};

export type ImmersionCompanyContact = {
  id: ImmersionContactInCompanyId;
  name: string;
  fistname: string;
  email: string;
  role: string;
  siret_institution: string;
};

export class ImmersionOfferEntity {
  constructor(private props: ImmersionOfferProps) {}

  public getName() {
    return this.props.name;
  }

  public toArrayOfProps() {
    return [
      this.props.id,
      this.props.rome,
      this.props.naf,
      this.props.siret,
      this.props.name,
      this.props.voluntary_to_immersion,
      this.props.data_source,
      this.props.score,
    ];
  }
}
