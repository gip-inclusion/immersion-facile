import { Email, SiretDto } from "shared";
import { MarketingContact } from "../entities/MarketingContact";

export type EstablishmentMarketingContactEntity = {
  contactEmail: Email;
  siret: SiretDto;
  emailContactHistory: MarketingContact[];
};

export type EstablishmentMarketingRepository = {
  delete(siret: SiretDto): Promise<void>;
  save(
    marketingEstablishmentContact: EstablishmentMarketingContactEntity,
  ): Promise<void>;

  getBySiret(
    siret: SiretDto,
  ): Promise<EstablishmentMarketingContactEntity | undefined>;
};
