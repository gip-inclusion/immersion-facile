import type { BanEstablishmentPayload, SiretDto } from "shared";
import type {
  BannedEstablishment,
  BannedEstablishmentRepository,
} from "../ports/BannedEstablishmentRepository";

export class InMemoryBannedEstablishmentRepository
  implements BannedEstablishmentRepository
{
  public bannedEstablishments: BannedEstablishment[] = [];

  public async getBannedEstablishments(): Promise<BannedEstablishment[]> {
    return this.bannedEstablishments;
  }

  public async getBannedEstablishmentBySiret(
    siret: SiretDto,
  ): Promise<BannedEstablishment | undefined> {
    return this.bannedEstablishments.find(
      (bannedEstablishment) => bannedEstablishment.siret === siret,
    );
  }
  public async banEstablishment({
    siret,
    bannishmentJustification,
  }: BanEstablishmentPayload): Promise<void> {
    this.bannedEstablishments.push({ siret, bannishmentJustification });
  }
}
