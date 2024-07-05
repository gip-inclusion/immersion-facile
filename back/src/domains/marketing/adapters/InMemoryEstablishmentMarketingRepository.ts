import { SiretDto } from "shared";
import {
  EstablishmentMarketingContactEntity,
  EstablishmentMarketingRepository,
} from "../ports/EstablishmentMarketingRepository";

export class InMemoryEstablishementMarketingRepository
  implements EstablishmentMarketingRepository
{
  async delete(siret: SiretDto): Promise<void> {
    this.contacts = this.contacts.filter((contact) => contact.siret !== siret);
  }

  async getBySiret(
    siret: SiretDto,
  ): Promise<EstablishmentMarketingContactEntity | undefined> {
    return this.#contacts[siret];
  }

  async save(
    marketingEstablishmentContact: EstablishmentMarketingContactEntity,
  ): Promise<void> {
    this.#contacts = {
      ...this.#contacts,
      [marketingEstablishmentContact.siret]: marketingEstablishmentContact,
    };
  }

  #contacts: Record<SiretDto, EstablishmentMarketingContactEntity> = {};

  public get contacts(): EstablishmentMarketingContactEntity[] {
    return Object.values(this.#contacts);
  }

  public set contacts(contact: EstablishmentMarketingContactEntity[]) {
    this.#contacts = contact.reduce(
      (acc, contact) => ({
        ...acc,
        [contact.siret]: contact,
      }),
      {} as Record<SiretDto, EstablishmentMarketingContactEntity>,
    );
  }
}
