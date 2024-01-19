import { SiretDto } from "shared";
import { EstablishmentLead } from "../entities/EstablishmentLeadEntity";

export interface EstablishmentLeadRepository {
  save(establishmentLead: EstablishmentLead): Promise<void>;
  getBySiret(siret: SiretDto): Promise<EstablishmentLead | undefined>;
}
