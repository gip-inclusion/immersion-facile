import { Flavor } from "../../../shared/typeFlavors";

export type ImmersionOfferId = Flavor<string, "ImmersionProposalId">;

export class ImmersionOfferEntity {
  constructor(
    private id: ImmersionOfferId,
    private rome: string,
    private naf: string,
    private siret: string,
    private name: string,
  ) {}

  public getName() {
    return this.name;
  }

  public toArrayOfProps() {
    return [this.id, this.rome, this.naf, this.siret, this.name];
  }
}
