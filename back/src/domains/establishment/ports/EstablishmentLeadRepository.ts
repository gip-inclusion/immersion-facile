import { SiretDto } from "shared";
import { EstablishmentLead } from "../entities/EstablishmentLeadEntity";
import { EstablishmentLeadReminderParams } from "../use-cases/SendEstablishmentLeadReminderScript";

export interface EstablishmentLeadRepository {
  save(establishmentLead: EstablishmentLead): Promise<void>;
  getBySiret(siret: SiretDto): Promise<EstablishmentLead | undefined>;
  getSiretsByUniqLastEventKind(
    params: EstablishmentLeadReminderParams,
  ): Promise<SiretDto[]>;
}
