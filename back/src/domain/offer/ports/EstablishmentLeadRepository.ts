import { SiretDto } from "shared";
import { EstablishmentLead } from "../entities/EstablishmentLeadEntity";
import { EstablishmentLeadReminderParams } from "../useCases/SendEstablishmentLeadReminderScript";

export interface EstablishmentLeadRepository {
  save(establishmentLead: EstablishmentLead): Promise<void>;
  getBySiret(siret: SiretDto): Promise<EstablishmentLead | undefined>;
  getSiretsByUniqLastEventKind(
    params: EstablishmentLeadReminderParams,
  ): Promise<SiretDto[]>;
}
