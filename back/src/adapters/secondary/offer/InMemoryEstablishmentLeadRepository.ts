import { SiretDto } from "shared";
import { EstablishmentLead } from "../../../domain/offer/entities/EstablishmentLeadEntity";
import { EstablishmentLeadRepository } from "../../../domain/offer/ports/EstablishmentLeadRepository";

export class InMemoryEstablishmentLeadRepository
  implements EstablishmentLeadRepository
{
  #establishmentLeads: EstablishmentLead[] = [];

  public getBySiret(siret: SiretDto): EstablishmentLead[] {
    return this.#establishmentLeads.filter(
      (establishmentLead) => establishmentLead.siret === siret,
    );
  }

  public save(establishmentLead: EstablishmentLead): Promise<void> {
    this.#establishmentLeads.push(establishmentLead);
    return Promise.resolve();
  }
}
