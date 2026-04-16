import type { BannedEstablishment, SiretDto } from "shared";

export interface BannedEstablishmentRepository {
  getBannedEstablishmentBySiret(
    siret: SiretDto,
  ): Promise<BannedEstablishment | undefined>;
  banEstablishment({
    siret,
    bannishmentJustification,
  }: {
    siret: SiretDto;
    bannishmentJustification: string;
  }): Promise<void>;
}
