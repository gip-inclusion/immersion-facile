import { Email, SiretDto } from "shared";
import { MarketingContact } from "../entities/MarketingContact";

export type MarketingEstablishmentContactEntity = {
  contactEmail: Email;
  siret: SiretDto;
  emailContactHistory: MarketingContact[];
};

export type EstablishmentMarketingRepository = {
  save(
    marketingEstablishmentContact: MarketingEstablishmentContactEntity,
  ): Promise<void>;

  getBySiret(
    siret: SiretDto,
  ): Promise<MarketingEstablishmentContactEntity | undefined>;
};
