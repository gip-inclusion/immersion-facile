import { EditFormEstablishementPayload } from "../../../shared/tokens/MagicLinkPayload";
import { DomainEvent } from "../eventBus/events";

export interface OutboxRepository {
  getLastPayloadOfFormEstablishmentEditLinkSentWithSiret: (
    siret: string,
  ) => Promise<EditFormEstablishementPayload | undefined>;
  save: (event: DomainEvent) => Promise<void>;
  getAllUnpublishedEvents: () => Promise<DomainEvent[]>;
  markEventsAsPublished: (events: DomainEvent[]) => Promise<void>;
}
