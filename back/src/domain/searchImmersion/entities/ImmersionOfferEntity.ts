import { Flavor } from "../../../shared/typeFlavors";

export type ImmersionOfferId = Flavor<string, "ImmersionProposalId">;

export class ImmersionOfferEntity {
  constructor(
    private id: ImmersionOfferId,
    private rome: string,
    private siret: string,
    private name: string,
    private dataSource: string,
    private score: number,
  ) {}

  public getName() {
    return this.name;
  }

  public toArrayOfProps() {
    return [
      this.id,
      this.rome,
      this.siret,
      this.name,
      this.dataSource,
      this.score,
    ];
  }
}
