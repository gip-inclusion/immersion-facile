import type { SiretDto } from "shared";
import type { BannedEstablishment } from "../use-cases/BanEstablishment";

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
