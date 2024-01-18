import { EstablishmentLead } from "../entities/EstablishmentLeadEntity";

export interface EstablishmentLeadRepository {
  save(establishmentLead: EstablishmentLead): Promise<void>;
}
