import { match, P } from "ts-pattern";
import { SiretDto } from "shared";
import {
  EstablishmentLead,
  EstablishmentLeadEvent,
} from "../../../../domain/offer/entities/EstablishmentLeadEntity";
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
      const eventToAdd: EstablishmentLeadEvent = match(event)
        .with(
          { kind: "to-be-reminded" },
          ({ kind, convention_id, occurred_at }) => {
            if (!convention_id)
              throw new Error(
                `Establishment Lead with kind '${kind}' has no convention id. Lead event siret was '${siret}'`,
              );

            return {
              kind,
              occurredAt: occurred_at,
              conventionId: convention_id,
            };
          },
        )
        .with(
          {
            kind: "reminder-sent",
          },
          ({ kind, notification_kind, notification_id, occurred_at }) => {
            if (!notification_kind || !notification_id)
              throw new Error(
                `Establishment Lead with kind '${kind}' has no notification_kind or notification_id'. Lead event siret was '${siret}'`,
              );
            return {
              kind,
              occurredAt: occurred_at,
              notification: { id: notification_id, kind: notification_kind },
            };
          },
        )
        .with(
          { kind: P.union("registration-accepted", "registration-refused") },
          ({ kind, occurred_at }) => ({
            kind,
            occurredAt: occurred_at,
          }),
        )
        .exhaustive();

      const newLead: EstablishmentLead = {
        siret: event.siret,
        lastEventKind: event.kind,
        events: [...(acc?.events ?? []), eventToAdd],
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
        establishmentLead.events.map(
          mapEventToEstablishmentLead(establishmentLead.siret),
        ),
      )
      .execute();
  }
}

const mapEventToEstablishmentLead =
  (siret: SiretDto) => (event: EstablishmentLeadEvent) =>
    match(event)
      .with(
        { kind: "to-be-reminded" },
        ({ kind, occurredAt, conventionId }) => ({
          siret,
          kind,
          occurred_at: occurredAt,
          convention_id: conventionId,
        }),
      )
      .with(
        { kind: "reminder-sent" },
        ({ kind, occurredAt, notification }) => ({
          siret,
          kind,
          occurred_at: occurredAt,
          notification_id: notification.id,
          notification_kind: notification.kind,
        }),
      )
      .otherwise(({ kind, occurredAt }) => ({
        siret,
        kind,
        occurred_at: occurredAt,
      }));
