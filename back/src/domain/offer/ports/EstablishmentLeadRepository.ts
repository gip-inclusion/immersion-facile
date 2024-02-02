import { SiretDto } from "shared";
import {
  EstablishmentLead,
  EstablishmentLeadEventKind,
} from "../entities/EstablishmentLeadEntity";

export interface EstablishmentLeadRepository {
  save(establishmentLead: EstablishmentLead): Promise<void>;
  getBySiret(siret: SiretDto): Promise<EstablishmentLead | undefined>;
  getSiretsByLastEventKind(
    kind: EstablishmentLeadEventKind,
  ): Promise<SiretDto[]>;
}
