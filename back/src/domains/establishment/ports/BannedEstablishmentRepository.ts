import type { BanEstablishmentPayload, SiretDto } from "shared";

export type BannedEstablishmentOutput = BanEstablishmentPayload;

export interface BannedEstablishmentRepository {
  getBannedEstablishmentBySiret(
    siret: SiretDto,
  ): Promise<BannedEstablishmentOutput | undefined>;
  banEstablishment({
    siret,
    bannishmentJustification,
  }: BanEstablishmentPayload): Promise<void>;
}
