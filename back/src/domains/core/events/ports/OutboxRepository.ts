import { EventStatus } from "../../../../config/pg/kysely/model/database";
import { DomainEvent } from "../events";

export interface OutboxRepository {
  countAllEvents(params: { status: EventStatus }): Promise<number>;
  save: (event: DomainEvent) => Promise<void>;
  markEventsAsInProcess: (events: DomainEvent[]) => Promise<void>;
}
