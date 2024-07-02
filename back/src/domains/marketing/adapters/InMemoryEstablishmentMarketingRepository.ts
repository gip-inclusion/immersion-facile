import { SiretDto } from "shared";
import {
  EstablishmentMarketingRepository,
  MarketingEstablishmentContactEntity,
} from "../ports/EstablishmentMarketingRepository";

export class InMemoryEstablishementMarketingRepository
  implements EstablishmentMarketingRepository
{
  async save(
    marketingEstablishmentContact: MarketingEstablishmentContactEntity,
  ): Promise<void> {
    this.#contacts = {
      ...this.#contacts,
      [marketingEstablishmentContact.siret]: marketingEstablishmentContact,
    };
  }

  #contacts: Record<SiretDto, MarketingEstablishmentContactEntity> = {};

  public get contacts(): MarketingEstablishmentContactEntity[] {
    return Object.values(this.#contacts);
  }

  public set contacts(contact: MarketingEstablishmentContactEntity[]) {
    this.#contacts = contact.reduce(
      (acc, contact) => ({
        ...acc,
        [contact.siret]: contact,
      }),
      {} as Record<SiretDto, MarketingEstablishmentContactEntity>,
    );
  }
}
