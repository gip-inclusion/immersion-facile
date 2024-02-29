import { prop, sortBy } from "ramda";
import { SiretDto } from "shared";
import {
  EstablishmentLead,
  EstablishmentLeadEvent,
  EstablishmentLeadEventKind,
} from "../entities/EstablishmentLeadEntity";
import { EstablishmentLeadRepository } from "../ports/EstablishmentLeadRepository";
import { EstablishmentLeadReminderParams } from "../use-cases/SendEstablishmentLeadReminderScript";

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

  public async getSiretsByUniqLastEventKind({
    kind,
    beforeDate,
  }: EstablishmentLeadReminderParams): Promise<SiretDto[]> {
    return Object.values(this.#establishmentLeads)
      .filter(({ lastEventKind, events }) => {
        const lastEvent = events
          .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())
          .at(-1);
        if (lastEvent === undefined) return false;

        const shouldKeep =
          lastEvent.kind === kind &&
          isEventOfThisKindUniq(lastEventKind, events);

        if (!shouldKeep) return false;

        if (!beforeDate) return true;
        return lastEvent.occurredAt <= beforeDate;
      })
      .map(({ siret }) => siret);
  }

  public async save(establishmentLead: EstablishmentLead): Promise<void> {
    this.#establishmentLeads[establishmentLead.siret] = establishmentLead;
  }
}

const isEventOfThisKindUniq = (
  kind: EstablishmentLeadEventKind,
  events: EstablishmentLeadEvent[],
) => events.filter((event) => event.kind === kind).length === 1;
