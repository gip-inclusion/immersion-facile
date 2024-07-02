import { SiretDto } from "shared";

import {
  MarketingEstablishment,
  MarketingGateway,
} from "../../ports/MarketingGateway";

export class InMemoryMarketingGateway implements MarketingGateway {
  async save(marketing: MarketingEstablishment): Promise<void> {
    this.#marketingEstablishments = {
      ...this.#marketingEstablishments,
      marketing,
    };
  }

  #marketingEstablishments: Record<SiretDto, MarketingEstablishment> = {};

  public get marketingEstablishments(): MarketingEstablishment[] {
    return Object.values(this.#marketingEstablishments);
  }

  public set marketingEstablishments(marketingEstablishments: MarketingEstablishment[]) {
    this.#marketingEstablishments = marketingEstablishments.reduce(
      (acc, marketingEstablishment) => ({
        ...acc,
        [marketingEstablishment.siret]: marketingEstablishment,
      }),
      {} as Record<SiretDto, MarketingEstablishment>,
    );
  }
}
