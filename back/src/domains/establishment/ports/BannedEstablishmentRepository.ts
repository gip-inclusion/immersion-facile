import type { BanEstablishmentPayload, SiretDto } from "shared";

export type BannedEstablishment = BanEstablishmentPayload;

export interface BannedEstablishmentRepository {
  getBannedEstablishments(): Promise<BannedEstablishment[]>;
  getBannedEstablishmentBySiret(
    siret: SiretDto,
  ): Promise<BannedEstablishment | undefined>;
  banEstablishment({
    siret,
    establishmentBannishmentJustification,
  }: BanEstablishmentPayload): Promise<void>;
}
