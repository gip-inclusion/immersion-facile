import type { SiretDto } from "shared";
import type { EstablishmentLead } from "../entities/EstablishmentLeadEntity";
import type { EstablishmentLeadReminderParams } from "../use-cases/SendEstablishmentLeadReminderScript";

export interface EstablishmentLeadRepository {
  save(establishmentLead: EstablishmentLead): Promise<void>;
  getBySiret(siret: SiretDto): Promise<EstablishmentLead | undefined>;
  getSiretsByUniqLastEventKind(
    params: EstablishmentLeadReminderParams,
  ): Promise<SiretDto[]>;
}
