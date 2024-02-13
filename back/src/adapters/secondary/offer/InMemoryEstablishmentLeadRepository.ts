import { descend, prop, sortBy, sortWith } from "ramda";
import { SiretDto } from "shared";
import {
  EstablishmentLead,
  EstablishmentLeadEventKind,
} from "../../../domain/offer/entities/EstablishmentLeadEntity";
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
    const establishmentLead = this.#establishmentLeads[siret];

    if (!establishmentLead) return;

    const sortedEvents = sortBy(prop("occurredAt"))(establishmentLead?.events);
    const lastEventKind = sortedEvents[sortedEvents.length - 1].kind;
    return { ...establishmentLead, lastEventKind };
  }

  public getSiretsByUniqLastEventKind(
    kind: EstablishmentLeadEventKind,
  ): Promise<SiretDto[]> {
    const sirets = Object.values(this.#establishmentLeads)
      .filter(
        ({ lastEventKind, events }) =>
          lastEventKind === kind &&
          events.filter((event) => event.kind === kind).length === 1,
      )
      .map(({ siret }) => siret);
    return Promise.resolve(sirets);
  }

  public async save(establishmentLead: EstablishmentLead): Promise<void> {
    this.#establishmentLeads[establishmentLead.siret] = establishmentLead;
  }
}
