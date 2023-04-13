import { EstablishmentJwtPayload } from "shared";

import { DomainEvent } from "../eventBus/events";

export interface OutboxQueries {
  getLastPayloadOfFormEstablishmentEditLinkSentWithSiret: (
    siret: string,
  ) => Promise<EstablishmentJwtPayload | undefined>;
  getAllUnpublishedEvents: () => Promise<DomainEvent[]>;
  getAllFailedEvents: () => Promise<DomainEvent[]>;
}
