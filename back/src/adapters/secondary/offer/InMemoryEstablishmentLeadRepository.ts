import { SiretDto } from "shared";
import { EstablishmentLead } from "../../../domain/offer/entities/EstablishmentLeadEntity";
import { EstablishmentLeadRepository } from "../../../domain/offer/ports/EstablishmentLeadRepository";

export class InMemoryEstablishmentLeadRepository
  implements EstablishmentLeadRepository
{
  #establishmentLeads: Record<SiretDto, EstablishmentLead> = {};

  public get establishmentLeads(): EstablishmentLead[] {
    return Object.values(this.#establishmentLeads);
  }

  public set establishmentLeads(leads: EstablishmentLead[]) {
    this.#establishmentLeads = leads.reduce(
      (acc, lead) => ({ ...acc, [lead.siret]: lead }),
      {} as Record<SiretDto, EstablishmentLead>,
    );
  }

  public async getBySiret(
    siret: SiretDto,
  ): Promise<EstablishmentLead | undefined> {
    return this.#establishmentLeads[siret];
  }

  public async save(establishmentLead: EstablishmentLead): Promise<void> {
    this.#establishmentLeads[establishmentLead.siret] = establishmentLead;
  }
}
