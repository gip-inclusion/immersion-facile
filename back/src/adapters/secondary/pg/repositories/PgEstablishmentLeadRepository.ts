import { SiretDto } from "shared";
import { EstablishmentLead } from "../../../../domain/offer/entities/EstablishmentLeadEntity";
import { EstablishmentLeadRepository } from "../../../../domain/offer/ports/EstablishmentLeadRepository";
import { KyselyDb } from "../kysely/kyselyUtils";

export class PgEstablishmentLeadRepository
  implements EstablishmentLeadRepository
{
  #transaction: KyselyDb;

  constructor(transaction: KyselyDb) {
    this.#transaction = transaction;
  }

  public async getBySiret(
    siret: SiretDto,
  ): Promise<EstablishmentLead | undefined> {
    const leadEvents = await this.#transaction
      .selectFrom("establishment_lead_events")
      .selectAll()
      .where("siret", "=", siret)
      .orderBy("occurred_at asc")
      .execute();

    if (leadEvents.length === 0) return;

    return leadEvents.reduce((acc, event) => {
      const {
        siret,
        convention_id,
        kind,
        notification_id,
        notification_kind,
        occurred_at,
      } = event;
      const withNotification =
        notification_id && notification_kind
          ? { notification: { id: notification_id, kind: notification_kind } }
          : null;

      const newLead: EstablishmentLead = {
        siret,
        lastEventKind: kind,
        events: [
          ...(acc?.events ?? []),
          {
            conventionId: convention_id,
            kind,
            occuredAt: occurred_at,
            ...withNotification,
          },
        ],
      };
      return newLead;
    }, {} as EstablishmentLead);
  }

  public async save(establishmentLead: EstablishmentLead): Promise<void> {
    await this.#transaction
      .deleteFrom("establishment_lead_events")
      .where("siret", "=", establishmentLead.siret)
      .execute();

    await this.#transaction
      .insertInto("establishment_lead_events")
      .values(
        establishmentLead.events.map((event) => ({
          convention_id: event.conventionId,
          kind: event.kind,
          siret: establishmentLead.siret,
          occurred_at: event.occuredAt,
          notification_id: event.notification?.id,
          notification_kind: event.notification?.kind,
        })),
      )
      .execute();
  }
}
