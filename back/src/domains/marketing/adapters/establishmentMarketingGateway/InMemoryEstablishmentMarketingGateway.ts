import { Email, SiretDto } from "shared";

import {
  EstablishmentMarketingGateway,
  EstablishmentMarketingGatewayDto,
} from "../../ports/EstablishmentMarketingGateway";

export class InMemoryEstablishmentMarketingGateway
  implements EstablishmentMarketingGateway
{
  async delete(contactEmail: Email): Promise<void> {
    this.marketingEstablishments = this.marketingEstablishments.filter(
      ({ email }) => contactEmail !== email,
    );
  }

  async save(marketing: EstablishmentMarketingGatewayDto): Promise<void> {
    this.#marketingEstablishments = {
      ...this.#marketingEstablishments,
      [marketing.siret]: marketing,
    };
  }

  #marketingEstablishments: Record<SiretDto, EstablishmentMarketingGatewayDto> =
    {};

  public get marketingEstablishments(): EstablishmentMarketingGatewayDto[] {
    return Object.values(this.#marketingEstablishments);
  }

  public set marketingEstablishments(marketingEstablishments: EstablishmentMarketingGatewayDto[]) {
    this.#marketingEstablishments = marketingEstablishments.reduce(
      (acc, marketingEstablishment) => ({
        ...acc,
        [marketingEstablishment.siret]: marketingEstablishment,
      }),
      {} as Record<SiretDto, EstablishmentMarketingGatewayDto>,
    );
  }
}
