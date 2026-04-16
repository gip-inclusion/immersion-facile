import type { BanEstablishmentPayload, SiretDto } from "shared";
import type {
  BannedEstablishmentOutput,
  BannedEstablishmentRepository,
} from "../ports/BannedEstablishmentRepository";

export class InMemoryBannedEstablishmentRepository
  implements BannedEstablishmentRepository
{
  public bannedEstablishments: BannedEstablishmentOutput[] = [];

  public async getBannedEstablishmentBySiret(
    siret: SiretDto,
  ): Promise<BannedEstablishmentOutput | undefined> {
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
