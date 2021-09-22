import { Flavor } from "../../../shared/typeFlavors";

export type ImmersionOfferId = Flavor<string, "ImmersionProposalId">;

export class ImmersionOfferEntity {
  constructor(
    private id: ImmersionOfferId,
    private naf: string,
    private rome: string,
    private siret: string,
    private name: string,
  ) {}

  public getName() {
    return this.name;
  }

  public toArrayOfProps() {
    return [this.id, this.name, this.naf, this.rome, this.siret];
  }
}
